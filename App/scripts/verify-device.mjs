import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';

const device = process.argv[2] || '33003782591214ed';
const adb = (cmd) => execFileSync('adb', ['-s', device, 'shell', cmd]).toString().trim();

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
const pages = await browser.pages();
const page = pages.find((p) => p.url().includes('generatoreqr')) || pages[0];

const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.waitForSelector('#url-input');
await page.type('#url-input', 'https://esempio.com');
await new Promise((r) => setTimeout(r, 700));

const canvas = await page.evaluate(() => {
  const c = document.getElementById('final-canvas');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let dark = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 128) dark++;
  return { size: c.width, darkPixels: dark };
});

await page.click('#download-btn');
await new Promise((r) => setTimeout(r, 2500));

const status = await page.$eval('#status-message', (el) => el.textContent);
const focusedAfterDownload = adb('dumpsys window | grep mCurrentFocus');
const album = adb('ls -l /sdcard/Pictures/Generatore-QR/ 2>&1 | tail -5');

console.log(JSON.stringify({ canvas, status, focusedAfterDownload, album, errors }, null, 2));

await browser.disconnect();