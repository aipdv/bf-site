// Checks that public/_headers sets the browser security headers and that its CSP
// allows every inline script and inline event handler in the build.
// Run after `npm run build`: node tests/headers.test.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

const headers = readFileSync('public/_headers', 'utf8');
const get = (name) => headers.match(new RegExp(`^\\s+${name}:\\s*(.+)$`, 'mi'))?.[1];
for (const name of ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options', 'Permissions-Policy', 'X-Content-Type-Options']) {
  assert.ok(get(name), `${name} missing from public/_headers`);
}

const csp = get('Content-Security-Policy');
assert.match(csp, /frame-ancestors 'none'/);
assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/, 'script-src must use hashes, not unsafe-inline');

// ponytail: regex over Astro's minified output, not an HTML parser. Fine while handler values hold no entities.
const sha = (text) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;
const pages = readdirSync('dist', { recursive: true }).filter((f) => f.endsWith('.html'));
assert.ok(pages.length > 0, 'no HTML in dist/, run npm run build first');
for (const page of pages) {
  const html = readFileSync(`dist/${page}`, 'utf8');
  for (const [, body] of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    assert.ok(csp.includes(sha(body)), `${page}: inline script ${sha(body)} not in CSP`);
  }
  for (const [, body] of html.matchAll(/\son[a-z]+="([^"]*)"/g)) {
    assert.ok(csp.includes(sha(body)), `${page}: inline handler "${body}" ${sha(body)} not in CSP`);
  }
}
console.log(`headers ok: ${pages.length} pages`);
