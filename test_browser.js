const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  const fileUrl = 'file://' + path.resolve('Index copy 2.html');
  console.log('Navigating to', fileUrl);
  await page.goto(fileUrl);
  
  // Wait a bit to see what happens
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
