import puppeteer from 'puppeteer-core';

const url = process.argv[2] || 'http://localhost:8765/index.html';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

const page = await browser.newPage();
await page.setViewport({ width: 412, height: 900, isMobile: true, hasTouch: true });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
page.on('requestfailed', (req) => errors.push('requestfailed: ' + req.url()));

await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 2000));

const splashVisible = await page.$eval('#custom-splash', (el) => getComputedStyle(el).display !== 'none');

await page.type('#url-input', 'https://esempio.com');
await new Promise((r) => setTimeout(r, 600));

const canvasStats = await page.evaluate(() => {
  const canvas = document.getElementById('final-canvas');
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let dark = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 128 && data[i + 1] < 128 && data[i + 2] < 128) dark++;
  }
  return { width: canvas.width, height: canvas.height, darkPixels: dark };
});

const downloadEnabled = await page.$eval('#download-btn', (el) => !el.disabled);
const shareEnabled = await page.$eval('#share-btn', (el) => !el.disabled);

const tabs = await page.$$eval('.tab-btn', (els) => els.length);
await page.click('#tab-wifi');
await page.type('#wifi-ssid', 'ReteDiProva');
await new Promise((r) => setTimeout(r, 500));

const wifiPayload = await page.evaluate(() => buildPayload());

await page.click('#tab-url');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: '/tmp/opencode/app-mobile.png', fullPage: false });

console.log(JSON.stringify({
  splashVisible,
  tabs,
  canvasStats,
  downloadEnabled,
  shareEnabled,
  wifiPayload,
  errors
}, null, 2));

await browser.close();