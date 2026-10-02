import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const wwwDir = join(root, 'www');
const assetsDir = join(wwwDir, 'assets');

if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

let html = readFileSync(join(root, 'index.html'), 'utf8');

const replacements = [
  [
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<link rel="stylesheet" href="assets/app.css">'
  ],
  [
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>',
    '<script src="assets/qrcode.min.js"></script>'
  ],
  ['Sito%20Web/favicon.svg', 'assets/icon.svg'],
  ['href="favicon.svg"', 'href="assets/icon.svg"']
];

for (const [from, to] of replacements) {
  html = html.split(from).join(to);
}

writeFileSync(join(wwwDir, 'index.html'), html);
copyFileSync(join(root, 'icon.svg'), join(assetsDir, 'icon.svg'));
copyFileSync(join(root, 'vendor', 'qrcode.min.js'), join(assetsDir, 'qrcode.min.js'));

const leftovers = [...html.matchAll(/(src|href)="https?:\/\/[^"]+"/g)].map((m) => m[0]);
if (leftovers.length) {
  console.error('Risorse esterne non localizzate:', leftovers);
  process.exit(1);
}

console.log('Web assets preparati in www/');