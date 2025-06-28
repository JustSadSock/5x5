const { test } = require('node:test');
const assert = require('assert');
const { chromium } = require('playwright');
const { spawn } = require('child_process');

test('replay pauses on final frame', async () => {
  const server = spawn('node', ['server.js'], { detached: true, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/?ws=ws://localhost:8080');

  await page.evaluate(() => {
    const frames = Array.from({ length: 3 }, () => cloneState());
    replayHistory = [{ actions: { A: [], B: [] }, states: frames }];
    updateReplayButton();
  });

  await page.click('#replayBtn');
  await page.waitForSelector('#replayOverlay.show');

  await page.waitForTimeout(2500); // allow playback to finish

  const paused = await page.evaluate(() => replayPaused);
  const index = await page.evaluate(() => replayIndex);
  const frameCount = await page.evaluate(() => replayFrames.length);
  const pauseText = await page.evaluate(() => document.getElementById('replayPause').textContent);
  const overlayVisible = await page.evaluate(() => document.getElementById('replayOverlay').classList.contains('show'));

  assert.equal(paused, true);
  assert.equal(index, frameCount - 1);
  assert.equal(pauseText, '▶');
  assert.equal(overlayVisible, true);

  await browser.close();
  process.kill(-server.pid);
});
