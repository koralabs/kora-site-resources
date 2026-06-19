// Copies non-TS assets (CSS) from src/ into lib/ preserving structure, since `tsc`
// only emits JS/d.ts. Vanilla Node, no deps.
import { cpSync, statSync } from 'node:fs';

cpSync('src', 'lib', {
    recursive: true,
    filter: (src) => statSync(src).isDirectory() || src.endsWith('.css'),
});

console.log('copy-assets: copied *.css from src/ to lib/');
