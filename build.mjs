// build.mjs — Post-build: reads the Next.js static export and creates a
// single-file INIT_HTML constant that can be served inline by the CLI.
// For now this is a no-op placeholder since the app is served via Next.js dev/start.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'out');
const distDir = join(__dirname, 'dist');

mkdirSync(distDir, { recursive: true });

let html = '<!-- init-web: Next.js app -->';

if (existsSync(join(outDir, 'index.html'))) {
  html = readFileSync(join(outDir, 'index.html'), 'utf-8');
}

const escaped = JSON.stringify(html);
const content = `export const INIT_HTML = ${escaped};\n`;

writeFileSync(join(distDir, 'index.js'), content, 'utf-8');
writeFileSync(join(distDir, 'index.d.ts'), 'export declare const INIT_HTML: string;\n', 'utf-8');

console.log('[init-web] build complete');
