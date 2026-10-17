import { existsSync, mkdirSync, copyFileSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const wwwDir = join(root, 'www');
const assetsDir = join(wwwDir, 'assets');
const vendorDir = join(root, 'vendor');

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
  [
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />',
    '<link rel="stylesheet" href="assets/leaflet/leaflet.css">'
  ],
  [
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>',
    '<script src="assets/leaflet/leaflet.js"></script>'
  ],
  [
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=location_on" />',
    '<link rel="stylesheet" href="assets/material-symbols.css">'
  ],
  ['Sito%20Web/favicon.svg', 'assets/icon.svg'],
  ['href="favicon.svg"', 'href="assets/icon.svg"']
];

for (const [from, to] of replacements) {
  html = html.split(from).join(to);
}

// rimuove eventuali code fence markdown finite per errore nell'HTML
html = html.replace(/```\s*$/, '');

writeFileSync(join(wwwDir, 'index.html'), html);

copyFileSync(join(root, 'icon.svg'), join(assetsDir, 'icon.svg'));
copyFileSync(join(vendorDir, 'qrcode.min.js'), join(assetsDir, 'qrcode.min.js'));
copyFileSync(join(vendorDir, 'material-symbols.css'), join(assetsDir, 'material-symbols.css'));
cpSync(join(vendorDir, 'leaflet'), join(assetsDir, 'leaflet'), { recursive: true });
cpSync(join(vendorDir, 'fonts'), join(assetsDir, 'fonts'), { recursive: true });

const leftovers = [...html.matchAll(/<(?:script|link)[^>]*(?:src|href)="https?:\/\/[^"]+"/g)].map((m) => m[0]);
if (leftovers.length) {
  console.error('Risorse esterne non localizzate:', leftovers);
  process.exit(1);
}

console.log('Web assets preparati in www/');