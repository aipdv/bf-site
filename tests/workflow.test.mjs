// The deploy step runs with CLOUDFLARE_API_TOKEN. Every npx package it fetches must be an exact version.
// Run: node tests/workflow.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const yml = readFileSync('.github/workflows/deploy.yml', 'utf8');
for (const [, spec] of yml.matchAll(/npx\s+(?:--yes\s+)?(\S+)/g)) {
  assert.match(spec, /@\d+\.\d+\.\d+$/, `npx ${spec} is not pinned to an exact version`);
}
console.log('workflow ok');
