'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'crypto-environment.html'), 'utf8');

test('Environmental Mission page covers UN SDGs 8, 9, 11, and 12', () => {
  assert.match(html, /Supporting the UN Sustainable Development Goals/);
  assert.match(html, /Goal 8 — Decent work and economic growth/);
  assert.match(html, /Goal 9 — Industry, innovation and infrastructure/);
  assert.match(html, /Goal 11 — Sustainable cities and communities/);
  assert.match(html, /Goal 12 — Responsible consumption and production/);
  assert.match(html, /https:\/\/sdgs\.un\.org\/goals/);
});
