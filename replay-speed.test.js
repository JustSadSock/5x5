const { test } = require('node:test');
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');

// This test verifies that clicking the replay speed buttons updates the
// active class and actually changes the replay speed.

test('replay speed buttons change active class and speed', async () => {
  const server = spawn('node', ['server.js'], { detached: true, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/?ws=ws://localhost:8080');

  // Provide a simple replay so the overlay can be opened
  await page.evaluate(() => {
    const frames = Array.from({ length: 10 }, () => cloneState());
    replayHistory = [{ actions: { A: [], B: [] }, states: frames }];
    updateReplayButton();
  });

  await page.click('#replayBtn');
  await page.waitForSelector('#replayOverlay.show');

  // Wait for the first frame at normal speed
  await page.waitForTimeout(750);
  const indexAt1x = await page.evaluate(() => replayIndex);

  // Switch to 5x speed
  await page.click('.speedBtn[data-speed="5"]');
  const speed5 = await page.evaluate(() => replaySpeed);
  assert.equal(speed5, 5);
  const active5 = await page.evaluate(() =>
    [...document.querySelectorAll('.speedBtn')].find(b => b.classList.contains('active')).dataset.speed
  );
  assert.equal(active5, '5');

  await page.waitForTimeout(300);
  const indexAfter5x = await page.evaluate(() => replayIndex);
  assert.ok(indexAfter5x - indexAt1x >= 2); // should advance faster

  // Switch to 2x speed and verify active class again
  await page.click('.speedBtn[data-speed="2"]');
  const speed2 = await page.evaluate(() => replaySpeed);
  assert.equal(speed2, 2);
  const active2 = await page.evaluate(() =>
    [...document.querySelectorAll('.speedBtn')].find(b => b.classList.contains('active')).dataset.speed
  );
  assert.equal(active2, '2');

  await browser.close();
  process.kill(-server.pid);
});
