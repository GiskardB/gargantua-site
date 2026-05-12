// Patch dist/docs.html with the latest src/docs-data.js content.
//
// The bundle stores each asset under a UUID in a JSON manifest:
//   <script type="__bundler/manifest">{"<uuid>":{"mime":"...","compressed":true,"data":"<base64>"}}</script>
// The docs-data.js asset is identifiable because:
//   (a) it is referenced in the template before the React/Babel CDN scripts;
//   (b) its mime is application/javascript and it's the one whose decompressed
//       contents start with `// Auto-generated from docs/*.md`.
//
// We re-gzip + base64 the fresh docs-data.js and splice it back into the manifest.
//
// Usage: node .build/update-bundle.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bundlePath = join(root, 'dist/docs.html');
const docsDataPath = join(root, 'src/docs-data.js');

const bundle = readFileSync(bundlePath, 'utf8');
const docsData = readFileSync(docsDataPath, 'utf8');

// --- Locate the real manifest (skip the one referenced inside the unpacker script) ---
function extractTag(marker) {
    let i = bundle.indexOf(marker);
    i = bundle.indexOf(marker, i + 1); // second occurrence
    if (i < 0) throw new Error(`Could not find ${marker}`);
    const open = bundle.indexOf('>', i) + 1;
    const close = bundle.indexOf('</script>', open);
    return { open, close, raw: bundle.slice(open, close) };
}

const manifestPos = extractTag('__bundler/manifest');
const manifestObj = JSON.parse(manifestPos.raw.trim());

// --- Find the docs-data UUID by sniffing each decompressed JS asset ---
const candidates = Object.entries(manifestObj).filter(
    ([, e]) => e.mime === 'application/javascript' && e.compressed
);

let targetUuid = null;
for (const [uuid, entry] of candidates) {
    const compressed = Buffer.from(entry.data, 'base64');
    try {
        const decoded = gunzipSync(compressed).toString('utf8');
        if (decoded.startsWith('// Auto-generated from docs/*.md')) {
            targetUuid = uuid;
            console.log(`Found docs-data asset: ${uuid} (size before: ${decoded.length} bytes)`);
            break;
        }
    } catch (e) {
        // Not gzip — skip.
    }
}

if (!targetUuid) {
    throw new Error('Could not locate the docs-data.js asset in the bundle');
}

// --- Replace its data with the freshly-gzipped docs-data.js ---
const newCompressed = gzipSync(Buffer.from(docsData, 'utf8'));
const newBase64 = newCompressed.toString('base64');

const previous = manifestObj[targetUuid];
manifestObj[targetUuid] = {
    ...previous,
    data: newBase64,
};

console.log(`New docs-data size: ${docsData.length} bytes (gzip→${newCompressed.length}, base64→${newBase64.length})`);

// --- Splice the updated manifest JSON back into the bundle ---
//
// JSON.stringify preserves ordering and is what the original bundler used
// (single-line, no indentation). We keep the surrounding whitespace
// unchanged so diffs stay tight.
const leadingWs = manifestPos.raw.match(/^\s*/)[0];
const trailingWs = manifestPos.raw.match(/\s*$/)[0];
const newManifestJson = JSON.stringify(manifestObj);
const newBundle = bundle.slice(0, manifestPos.open)
    + leadingWs + newManifestJson + trailingWs
    + bundle.slice(manifestPos.close);

writeFileSync(bundlePath, newBundle, 'utf8');
console.log(`Patched ${bundlePath} (size: ${bundle.length} → ${newBundle.length})`);
