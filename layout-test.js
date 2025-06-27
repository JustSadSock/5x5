const { chromium } = require('playwright');
const { spawn } = require('child_process');

(async () => {
  const server = spawn('node', ['server.js'], { detached: true, stdio: 'ignore' });
  // Wait for server to start
  await new Promise(r => setTimeout(r, 1000));
  const browser = await chromium.launch();
  const widths = [320, 375, 425];
  let hasError = false;
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 640 } });
    const page = await context.newPage();
    await page.goto('http://localhost:8080/?ws=ws://localhost:8080');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    if (bodyWidth > width) {
      console.error(`Layout overflow at width ${width}: body ${bodyWidth}`);
      hasError = true;
    } else {
      console.log(`Width ${width} OK`);
    }
    await context.close();
  }
  await browser.close();
  process.kill(-server.pid);
  if (hasError) process.exit(1);
})();
