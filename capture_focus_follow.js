
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

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  // 1. Focus Mode
  console.log('Capturing Focus Mode...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 3000));
  const focusElement = await page.$('#app-container');
  if (focusElement) {
    await focusElement.screenshot({ path: path.join(dir, 'focus-mode.png'), omitBackground: true });
    console.log('Saved focus-mode.png');
  }

  // 2. Follow Mode
  console.log('Capturing Follow Mode...');
  await page.goto('http://localhost:5173/#follow', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  const followElement = await page.$('#timer'); // or app-container, check which is better
  // Try app-container for follow mode too, as it should be the wrapper
  const followContainer = await page.$('#app-container');
  if (followContainer) {
    await followContainer.screenshot({ path: path.join(dir, 'follow-mode.png'), omitBackground: true });
    console.log('Saved follow-mode.png');
  }

  // 3. Break Mode (we need to trigger this, e.g. by waiting or modifying file)
  // Since we can't easily modify file from here without restarting dev server or HMR,
  // we'll rely on a separate script or manual intervention if needed.
  // But actually, we can try to use page.evaluate to set state if exposed, or just rely on file modification outside.
  // Let's just do Focus and Follow here first. Break mode requires App.tsx modification.
  
  await browser.close();
})();
