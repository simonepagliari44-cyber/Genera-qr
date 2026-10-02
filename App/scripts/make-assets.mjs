import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetsDir = join(root, 'assets');
const svg = join(root, 'icon.svg');

if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

// Icona quadrata 1024x1024 (stesse proporzioni dell'SVG 200x200)
await sharp(svg, { density: 384 })
  .resize(1024, 1024)
  .png()
  .toFile(join(assetsDir, 'icon.png'));

// Sfondo per icona adattiva Android 12+
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#0F172A' } })
  .png()
  .toFile(join(assetsDir, 'icon-background.png'));

// Splash 2732x2732 bianco con l'icona grande centrata
const iconBuffer = await sharp(svg, { density: 384 }).resize(1100, 1100).png().toBuffer();

await sharp({
  create: { width: 2732, height: 2732, channels: 4, background: '#ffffff' }
})
  .composite([{ input: iconBuffer, top: Math.round((2732 - 1100) / 2), left: Math.round((2732 - 1100) / 2) }])
  .png()
  .toFile(join(assetsDir, 'splash.png'));

console.log('assets/icon.png, assets/icon-background.png e assets/splash.png generati');