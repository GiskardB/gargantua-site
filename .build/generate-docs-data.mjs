// Regenerate src/docs-data.js from docs/*.md.
// Order + glyphs + blurbs are kept consistent with the existing file —
// we read them from the old docs-data.js so the table-of-contents order
// doesn't reshuffle every time someone tweaks a description.
//
// Usage: node .build/generate-docs-data.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// ---- 1. Read the current DOCS_INDEX so we preserve order + glyphs ----
const oldDocsData = readFileSync(join(root, 'src/docs-data.js'), 'utf8');
const indexMatch = oldDocsData.match(/window\.DOCS_INDEX\s*=\s*(\[[\s\S]*?\]);/);
if (!indexMatch) {
    throw new Error('Could not find window.DOCS_INDEX in existing docs-data.js');
}
const oldIndex = JSON.parse(indexMatch[1]);

// ---- 2. Walk docs/ and build the new content map ----
const docsDir = join(root, 'docs');
const mdFiles = readdirSync(docsDir).filter(f => f.endsWith('.md'));

function deriveTitle(slug, body) {
    const m = body.match(/^#\s+(.+?)\s*$/m);
    if (m) return m[1].trim();
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function deriveBlurb(body) {
    // First non-heading, non-blockquote paragraph.
    const lines = body.split(/\r?\n/);
    let inFence = false;
    let buf = [];
    for (const line of lines) {
        if (line.startsWith('```')) { inFence = !inFence; continue; }
        if (inFence) continue;
        if (line.trim() === '') {
            if (buf.length) break;
            continue;
        }
        if (line.startsWith('#') || line.startsWith('>') || line.startsWith('|') || line.startsWith('-')) continue;
        buf.push(line.trim());
    }
    let blurb = buf.join(' ').trim();
    // Strip markdown emphasis / links for the TOC text.
    blurb = blurb.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
    blurb = blurb.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    blurb = blurb.replace(/`([^`]+)`/g, '$1');
    if (blurb.length > 160) blurb = blurb.slice(0, 157) + '...';
    return blurb;
}

const content = {};
const knownSlugs = new Set();
for (const file of mdFiles) {
    const slug = file.replace(/\.md$/, '');
    knownSlugs.add(slug);
    const body = readFileSync(join(docsDir, file), 'utf8');
    content[slug] = body;
}

// ---- 3. Rebuild DOCS_INDEX: preserve order/glyph/blurb from old file ----
//   - Drop entries whose markdown no longer exists.
//   - Append any new slugs at the end with a derived blurb + default glyph.
const newIndex = [];
const seen = new Set();

for (const entry of oldIndex) {
    if (!knownSlugs.has(entry.slug)) continue;
    seen.add(entry.slug);
    newIndex.push({
        slug: entry.slug,
        title: deriveTitle(entry.slug, content[entry.slug]) || entry.title,
        blurb: entry.blurb,      // keep curated blurb
        glyph: entry.glyph,
    });
}

for (const slug of knownSlugs) {
    if (seen.has(slug)) continue;
    newIndex.push({
        slug,
        title: deriveTitle(slug, content[slug]),
        blurb: deriveBlurb(content[slug]),
        glyph: 'doc',
    });
}

// ---- 4. Serialise ----
function jsString(s) {
    return JSON.stringify(s);
}

const indexLines = newIndex.map(e =>
    `  {\n    "slug": ${jsString(e.slug)},\n    "title": ${jsString(e.title)},\n    "blurb": ${jsString(e.blurb)},\n    "glyph": ${jsString(e.glyph)}\n  }`
);

const contentLines = newIndex.map(e =>
    `  ${jsString(e.slug)}: ${jsString(content[e.slug])}`
);

const out = [
    '// Auto-generated from docs/*.md — do not edit by hand.',
    'window.DOCS_INDEX = [',
    indexLines.join(',\n'),
    '];',
    'window.DOCS_CONTENT = {',
    contentLines.join(',\n'),
    '};',
    '',
].join('\n');

writeFileSync(join(root, 'src/docs-data.js'), out, 'utf8');
console.log(`Generated src/docs-data.js — ${newIndex.length} docs, ${out.length} bytes`);
for (const e of newIndex) {
    console.log(`  ${e.slug.padEnd(28)} ${e.title}`);
}
