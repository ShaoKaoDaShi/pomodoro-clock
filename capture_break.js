
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const dir = 'screenshots';

  console.log('Capturing Break Mode...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 3000));
  const element = await page.$('#app-container');
  if (element) {
    await element.screenshot({ path: path.join(dir, 'break-mode.png'), omitBackground: true });
    console.log('Saved break-mode.png');
  }
  
  await browser.close();
})();
