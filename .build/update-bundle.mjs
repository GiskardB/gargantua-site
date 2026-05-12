// Patch dist/docs.html and dist/index.html with the latest sources.
//
// Both bundles store every asset under a UUID inside a JSON manifest:
//   <script type="__bundler/manifest">{"<uuid>":{"mime":"...","compressed":true,"data":"<base64>"}}</script>
//
// docs/*.md  -> src/docs-data.js  -> the gzipped JS asset inside dist/docs.html
//                                    whose first line is `// Auto-generated from docs/*.md`.
// src/*.jsx  -> each .jsx is its own gzipped JS asset inside dist/index.html, identifiable
//               by the first non-empty line of source (the file's "// Title" comment).
//
// We re-gzip + base64 each updated source and splice it back into the manifest.
//
// Usage: node .build/update-bundle.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** Splice fresh content into the matching asset of a bundle file. */
function patchBundle(bundlePath, replacements) {
    if (!existsSync(bundlePath)) {
        console.log(`(skipping) ${bundlePath} does not exist`);
        return;
    }
    const bundle = readFileSync(bundlePath, 'utf8');

    // --- Locate the real manifest (skip the one referenced inside the unpacker script) ---
    let i = bundle.indexOf('__bundler/manifest');
    i = bundle.indexOf('__bundler/manifest', i + 1);
    if (i < 0) throw new Error(`Could not find manifest in ${bundlePath}`);
    const open = bundle.indexOf('>', i) + 1;
    const close = bundle.indexOf('</script>', open);
    const manifestRaw = bundle.slice(open, close);
    const manifest = JSON.parse(manifestRaw.trim());

    // --- For each requested replacement, find the matching asset by header sniff ---
    const candidates = Object.entries(manifest).filter(
        ([, e]) => (e.mime === 'application/javascript' || e.mime === 'text/javascript') && e.compressed
    );

    let patched = 0;
    for (const { sourcePath, headerStartsWith } of replacements) {
        if (!existsSync(sourcePath)) {
            console.log(`  (no source) ${sourcePath} — skipped`);
            continue;
        }
        let foundUuid = null;
        for (const [uuid, entry] of candidates) {
            try {
                const decoded = gunzipSync(Buffer.from(entry.data, 'base64')).toString('utf8');
                if (decoded.startsWith(headerStartsWith)) {
                    foundUuid = uuid;
                    break;
                }
            } catch (_) { /* not gzip — skip */ }
        }
        if (!foundUuid) {
            console.log(`  (no match) ${sourcePath} — header "${headerStartsWith}" not found in any asset`);
            continue;
        }
        const fresh = readFileSync(sourcePath, 'utf8');
        const recompressed = gzipSync(Buffer.from(fresh, 'utf8'));
        const newBase64 = recompressed.toString('base64');
        manifest[foundUuid] = { ...manifest[foundUuid], data: newBase64 };
        console.log(`  patched ${sourcePath} -> ${foundUuid} (${fresh.length} bytes, gzip=${recompressed.length})`);
        patched++;
    }

    if (!patched) {
        console.log(`(no patches applied for ${bundlePath})`);
        return;
    }

    // --- Splice the updated manifest JSON back into the bundle (preserve whitespace) ---
    const leadingWs = manifestRaw.match(/^\s*/)[0];
    const trailingWs = manifestRaw.match(/\s*$/)[0];
    const newManifestJson = JSON.stringify(manifest);
    const newBundle = bundle.slice(0, open) + leadingWs + newManifestJson + trailingWs + bundle.slice(close);

    writeFileSync(bundlePath, newBundle, 'utf8');
    console.log(`${bundlePath}: ${bundle.length} -> ${newBundle.length} bytes (${patched} assets patched)\n`);
}

// ────────────────────────────────────────────────────────────────────────
// docs.html — pre-bundled markdown for the documentation site
// ────────────────────────────────────────────────────────────────────────
console.log('=== dist/docs.html ===');
patchBundle(join(root, 'dist/docs.html'), [
    { sourcePath: join(root, 'src/docs-data.js'),          headerStartsWith: '// Auto-generated from docs/*.md' },
    { sourcePath: join(root, 'src/docs-app.jsx'),          headerStartsWith: '// Docs app' },
    { sourcePath: join(root, 'src/docs-glyphs.jsx'),       headerStartsWith: '// Per-topic SVG glyphs' },
    { sourcePath: join(root, 'src/architecture-anim.jsx'), headerStartsWith: '// Animated request-journey' },
    { sourcePath: join(root, 'src/logo.jsx'),              headerStartsWith: '// Logo mark' },
]);

// ────────────────────────────────────────────────────────────────────────
// index.html — landing page, one asset per src/*.jsx
// ────────────────────────────────────────────────────────────────────────
console.log('=== dist/index.html ===');
patchBundle(join(root, 'dist/index.html'), [
    { sourcePath: join(root, 'src/hero.jsx'),         headerStartsWith: '// Hero' },
    { sourcePath: join(root, 'src/features.jsx'),     headerStartsWith: '// Features grid + tech stack ribbon' },
    { sourcePath: join(root, 'src/quickstart.jsx'),   headerStartsWith: '// Quick start' },
    { sourcePath: join(root, 'src/architecture.jsx'), headerStartsWith: '// Architecture' },
    { sourcePath: join(root, 'src/app.jsx'),          headerStartsWith: '// App entry' },
    { sourcePath: join(root, 'src/logo.jsx'),         headerStartsWith: '// Logo mark' },
    { sourcePath: join(root, 'src/blackhole.jsx'),    headerStartsWith: '// Black hole' },
]);
