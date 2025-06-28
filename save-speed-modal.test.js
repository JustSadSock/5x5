const { test } = require('node:test');
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');

// Verify that clicking Save opens a modal to choose speed
// and selecting a speed updates replaySpeed and calls saveReplayVideo.

test('save replay speed modal sets speed', async () => {
  const server = spawn('node', ['server.js'], { detached: true, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/?ws=ws://localhost:8080');

  // provide a dummy replay and stub saveReplayVideo
  await page.evaluate(() => {
    const frames = Array.from({ length: 2 }, () => cloneState());
    replayHistory = [{ actions: { A: [], B: [] }, states: frames }];
    updateReplayButton();
    window._saveCalled = false;
    window.saveReplayVideo = () => { window._saveCalled = true; };
  });

  await page.click('#replayBtn');
  await page.waitForSelector('#replayOverlay.show');

  await page.click('#saveReplay');
  await page.waitForSelector('#speedModal');

  await page.click('#speedModal button[data-speed="3"]');

  const speed = await page.evaluate(() => replaySpeed);
  const called = await page.evaluate(() => window._saveCalled);
  const modalGone = await page.evaluate(() => !document.getElementById('speedModal'));

  assert.equal(speed, 3);
  assert.ok(called);
  assert.ok(modalGone);

  await browser.close();
  process.kill(-server.pid);
});
