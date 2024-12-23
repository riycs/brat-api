require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const { chromium } = require('playwright');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('common'));

// Buat browser instance
let browser;

const launchBrowser = async () => {
  browser = await chromium.launch(); // Browser headless
}

launchBrowser();

app.get('/', async (req, res) => {
  const text = req.query.text
  if (!text) return res.status(400).json({ message: 'Text is required' });
  if (!browser) {
    await launchBrowser();
  }
  const context = await browser.newContext({
    viewport: {
      width: 1536,
      height: 695
    }
  });
  const page = await context.newPage();

  const filePath = path.join(__dirname, './site/index.html');

  // Open https://www.bratgenerator.com/
  await page.goto(`file://${filePath}`);

  // Click on <div> #toggleButtonWhite
  await page.click('#toggleButtonWhite');

  // Click on <div> #textOverlay
  await page.click('#textOverlay');

  // Click on <input> #textInput
  await page.click('#textInput');

  // Fill "sas" on <input> #textInput
  await page.fill('#textInput', text);

  const element = await page.$('#textOverlay');
  const box = await element.boundingBox();

  res.set('Content-Type', 'image/png');
  res.end(await page.screenshot({
    clip: {
      x: box.x,
      y: box.y,
      width: 500,
      height: 500
    }
  }));
  await context.close();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Menangani penutupan server
const closeBrowser = async () => {
  if (browser) {
    console.log('Closing browser...');
    await browser.close();
    console.log('Browser closed');
  }
};

process.on('SIGINT', async () => {
  console.log('SIGINT received');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received');
  await closeBrowser();
  process.exit(0);
});

process.on('exit', async () => {
  console.log('Process exiting');
  await closeBrowser();
});