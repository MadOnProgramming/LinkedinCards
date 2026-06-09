// scripts/screenshot.js
// Takes a screenshot of card.html and saves it as card.png

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting screenshot...');

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 760, height: 900, deviceScaleFactor: 2 });

  const cardPath = path.resolve(__dirname, '..', 'card.html');
  const cardHTML = fs.readFileSync(cardPath, 'utf8');

  await page.setContent(cardHTML, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const cardEl = await page.$('.card');
  const outputPath = path.resolve(__dirname, '..', 'card.png');

  if (cardEl) {
    await cardEl.screenshot({ path: outputPath, type: 'png' });
    console.log('Card screenshot saved to: ' + outputPath);
  } else {
    await page.screenshot({ path: outputPath, type: 'png', fullPage: false });
    console.log('Full page screenshot saved to: ' + outputPath);
  }

  await browser.close();
})();
