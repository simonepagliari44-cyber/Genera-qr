import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vendorDir = join(root, 'vendor');
const leafletDir = join(vendorDir, 'leaflet');
const fontsDir = join(vendorDir, 'fonts');

mkdirSync(join(leafletDir, 'images'), { recursive: true });
mkdirSync(fontsDir, { recursive: true });

const download = async (url, dest, headers) => {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buffer);
  console.log('scaricato', url, '->', dest.replace(root + '/', ''));
  return buffer;
};

// --- Leaflet 1.9.4 (mappa offline: JS/CSS + immagini marcatori) ---
await download('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', join(leafletDir, 'leaflet.js'));
await download('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', join(leafletDir, 'leaflet.css'));

for (const image of ['marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png', 'layers.png', 'layers-2x.png']) {
  await download(`https://unpkg.com/leaflet@1.9.4/dist/images/${image}`, join(leafletDir, 'images', image));
}

// --- Material Symbols (solo icona location_on) ---
const symbolsUrl =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=location_on';

const chromeHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const cssRes = await fetch(symbolsUrl, { headers: chromeHeaders });
if (!cssRes.ok) throw new Error(`Material Symbols -> HTTP ${cssRes.status}`);
let symbolsCss = await cssRes.text();

const fontUrls = [...symbolsCss.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]);

let index = 0;
for (const fontUrl of fontUrls) {
  const fileName = `material-symbols-${index++}.woff2`;
  await download(fontUrl, join(fontsDir, fileName), chromeHeaders);
  symbolsCss = symbolsCss.split(fontUrl).join(`fonts/${fileName}`);
}

writeFileSync(join(vendorDir, 'material-symbols.css'), symbolsCss);
console.log('vendored material-symbols.css (' + fontUrls.length + ' font)');

const qrcodePath = join(vendorDir, 'qrcode.min.js');
if (!existsSync(qrcodePath)) {
  await download('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', qrcodePath);
}