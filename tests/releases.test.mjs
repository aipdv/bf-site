// Checks the release-note parsers. Run: node --experimental-strip-types tests/releases.test.mjs
import assert from 'node:assert/strict';
import { youtubeId, firstLine } from '../src/lib/releases.ts';

assert.equal(youtubeId('see https://youtu.be/avyBBIjoKX4 now'), 'avyBBIjoKX4');
assert.equal(youtubeId('[![v](https://img.youtube.com/vi/x/hq.jpg)](https://www.youtube.com/watch?v=yNYCygtoW-Q&t=3)'), 'yNYCygtoW-Q');
assert.equal(youtubeId('no video here'), null);
assert.equal(youtubeId(null), null);
assert.equal(firstLine('# T\n\n[![v](https://img.youtube.com/vi/x/hq.jpg)](https://youtu.be/x)\nReal line.'), 'Real line.');
console.log('releases ok');
