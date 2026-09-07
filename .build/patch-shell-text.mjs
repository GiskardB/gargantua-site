// Patch arbitrary text (typically CSS in the "shell" HTML — the head/CSS/root-div markup
// copied verbatim from Gargantua.html / Docs.html at original bundle-build time) inside
// dist/index.html or dist/docs.html.
//
// update-bundle.mjs only re-patches assets it can identify by a JS-source "header" line
// (the first `// Comment` of a .jsx file) — it has no notion of the shell HTML/CSS, which
// has no standalone source file of its own; it only exists pre-baked inside the bundle,
// in one of two places:
//   1. A gzip+base64 asset in the `__bundler/manifest` script (same mechanism as the
//      .jsx assets update-bundle.mjs already knows how to patch).
//   2. A plain JSON-encoded string in a `<script type="__bundler/template">` tag — the
//      initial server-rendered-looking HTML shown before the manifest assets hydrate.
//      There are two such tags per bundle; the *second* one is the real one (mirrors the
//      manifest lookup's own `indexOf(..., i + 1)` — the first is a reference inside the
//      unpacker's own bootstrap code, not real content).
// This script tries (1) first, then falls back to (2), and applies an exact find/replace
// on whichever one actually contains the find-string.
//
// Usage: node .build/patch-shell-text.mjs <bundle-path> <find-file> <replace-file>
//   <find-file> / <replace-file>: plain text files holding the exact substrings.
//   Fails loudly if the find-string isn't found exactly once — a silent multi-match
//   would only patch the first occurrence, which is worse than refusing.

import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

const [, , bundlePath, findPath, replacePath] = process.argv;
if (!bundlePath || !findPath || !replacePath) {
    console.error('Usage: node .build/patch-shell-text.mjs <bundle-path> <find-file> <replace-file>');
    process.exit(1);
}

const find = readFileSync(findPath, 'utf8');
const replace = readFileSync(replacePath, 'utf8');
const bundle = readFileSync(bundlePath, 'utf8');

// ── Attempt 1: a gzip+base64 asset inside the manifest ─────────────────────
function tryManifest() {
    let i = bundle.indexOf('__bundler/manifest');
    i = bundle.indexOf('__bundler/manifest', i + 1);
    if (i < 0) return null;
    const open = bundle.indexOf('>', i) + 1;
    const close = bundle.indexOf('</script>', open);
    const manifestRaw = bundle.slice(open, close);
    const manifest = JSON.parse(manifestRaw.trim());

    const matches = [];
    for (const [uuid, entry] of Object.entries(manifest)) {
        if (!entry.compressed) continue;
        let decoded;
        try {
            decoded = gunzipSync(Buffer.from(entry.data, 'base64')).toString('utf8');
        } catch (_) {
            continue; // not gzip (e.g. a font) — skip
        }
        if (decoded.includes(find)) matches.push({ uuid, decoded });
    }
    if (matches.length === 0) return null;
    if (matches.length > 1) {
        throw new Error(`Find-string present in ${matches.length} manifest assets of ${bundlePath} — ambiguous, refusing to patch.`);
    }

    const { uuid, decoded } = matches[0];
    const patched = decoded.replace(find, replace);
    const recompressed = gzipSync(Buffer.from(patched, 'utf8'));
    manifest[uuid] = { ...manifest[uuid], data: recompressed.toString('base64') };

    const leadingWs = manifestRaw.match(/^\s*/)[0];
    const trailingWs = manifestRaw.match(/\s*$/)[0];
    const newManifestJson = JSON.stringify(manifest);
    return {
        newBundle: bundle.slice(0, open) + leadingWs + newManifestJson + trailingWs + bundle.slice(close),
        info: `manifest asset ${uuid} (${decoded.length} -> ${patched.length} bytes)`,
    };
}

// ── Attempt 2: the JSON-encoded string in <script type="__bundler/template"> ────
// The string's own content routinely contains literal "</script>" substrings (nested
// <script> tags in the serialized page), so closing it can't be found with a naive
// indexOf — that lands inside the JSON string and produces an unterminated-string parse
// error. Instead, scan from the opening quote respecting JSON escaping (\", \\, etc.) to
// find the real matching close-quote.
function findJsonStringEnd(text, quoteStart) {
    let i = quoteStart + 1;
    while (i < text.length) {
        const c = text[i];
        if (c === '\\') { i += 2; continue; } // skip the escaped character
        if (c === '"') return i; // unescaped quote: end of the JSON string
        i++;
    }
    throw new Error('Unterminated JSON string — no unescaped closing quote found.');
}

function tryTemplate() {
    let i = bundle.indexOf('__bundler/template');
    i = bundle.indexOf('__bundler/template', i + 1);
    if (i < 0) return null;
    const tagOpen = bundle.indexOf('>', i) + 1;
    const quoteStart = bundle.indexOf('"', tagOpen);
    const quoteEnd = findJsonStringEnd(bundle, quoteStart);
    const raw = bundle.slice(quoteStart, quoteEnd + 1);
    const decoded = JSON.parse(raw);
    if (!decoded.includes(find)) return null;

    const patched = decoded.replace(find, replace);
    // JSON.stringify leaves a closing-tag-like "less-than, slash" sequence as literal
    // text, which would prematurely close the *outer* <script type="__bundler/template">
    // tag from the HTML parser's point of view the moment it's re-embedded (the string
    // is full of nested <script>...</script> tags). The original bundler avoids this by
    // unicode-escaping the slash in every such sequence — match that, since plain
    // JSON-valid escaping on its own isn't HTML-safe here.
    const newRaw = JSON.stringify(patched).replace(/<\//g, '<\\u002F');
    return {
        newBundle: bundle.slice(0, quoteStart) + newRaw + bundle.slice(quoteEnd + 1),
        info: `__bundler/template string (${decoded.length} -> ${patched.length} chars)`,
    };
}

const result = tryManifest() ?? tryTemplate();
if (!result) {
    throw new Error(`Find-string not present in any manifest asset or the template string of ${bundlePath} — nothing to patch.`);
}

writeFileSync(bundlePath, result.newBundle, 'utf8');
console.log(`${bundlePath}: patched ${result.info}`);
