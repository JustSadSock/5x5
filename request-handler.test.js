const assert = require('assert');
const http = require('http');
const { test } = require('node:test');
const { requestHandler } = require('./server');

async function getStatus(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: 'localhost', port, path }, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
  });
}

test('requestHandler rejects paths containing ..', async () => {
  const server = http.createServer(requestHandler);
  await new Promise(res => server.listen(0, res));
  const { port } = server.address();

  const status1 = await getStatus(port, '/..');
  assert.equal(status1, 400);

  const status2 = await getStatus(port, '/js/../server.js');
  assert.equal(status2, 400);

  await new Promise(res => server.close(res));
});
