// Byte-range checks for the video function. Run: node tests/range.test.mjs
import assert from 'node:assert/strict';
import { onRequest } from '../functions/better-files-launch.mp4.js';

const bytes = new Uint8Array(1000).map((_, i) => i % 256);
const env = { ASSETS: { fetch: async () => new Response(bytes, { headers: { 'Content-Length': '1000' } }) } };
const get = (range) => onRequest({
  env,
  request: new Request('https://bf.test/better-files-launch.mp4', { headers: range ? { Range: range } : {} }),
});

// A 416 depends only on the visitor's Range header. A shared cache must not store it under the bare URL.
for (const range of ['bytes=5000-', 'bytes=-0']) {
  const r = await get(range);
  assert.equal(r.status, 416, range);
  assert.equal(r.headers.get('Content-Range'), 'bytes */1000');
  assert.equal(r.headers.get('Cache-Control'), 'no-store', `${range}: 416 must not be cacheable`);
}

// Normal answers stay correct and cacheable.
const part = await get('bytes=10-19');
assert.equal(part.status, 206);
assert.equal(part.headers.get('Content-Range'), 'bytes 10-19/1000');
assert.equal(part.headers.get('Cache-Control'), 'public, max-age=86400');
assert.deepEqual([...new Uint8Array(await part.arrayBuffer())], [...bytes.slice(10, 20)]);
assert.equal((await get()).status, 200);
console.log('range ok');
