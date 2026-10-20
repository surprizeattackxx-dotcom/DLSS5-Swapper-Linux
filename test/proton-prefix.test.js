'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { contextForPrefix } = require('../src/core/proton');

function steamTree(t, { proton = true, prefix = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dlss5-prefix-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const pfx = path.join(root, 'steamapps', 'compatdata', '4242', 'pfx');
  fs.mkdirSync(pfx, { recursive: true });
  if (prefix) fs.writeFileSync(path.join(pfx, 'system.reg'), '');
  if (proton) {
    const file = path.join(root, 'steamapps', 'common', 'Proton 9.0', 'proton');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
  }
  return { root, pfx, compat: path.dirname(pfx) };
}

test('a compatdata folder or its pfx folder both resolve to the same Proton context', { skip: process.platform !== 'linux' }, (t) => {
  const { root, pfx, compat } = steamTree(t);
  const expected = {
    proton: path.join(root, 'steamapps', 'common', 'Proton 9.0', 'proton'),
    prefix: pfx, steamRoot: root, appid: '4242'
  };
  assert.deepEqual(contextForPrefix(pfx), expected);
  assert.deepEqual(contextForPrefix(compat), expected);
});

test('a folder that is not a prefix, has no Proton, or is not absolute is refused', { skip: process.platform !== 'linux' }, (t) => {
  assert.equal(contextForPrefix(steamTree(t, { prefix: false }).pfx), null);
  assert.equal(contextForPrefix(steamTree(t, { proton: false }).pfx), null);
  assert.equal(contextForPrefix(os.tmpdir()), null);
  assert.equal(contextForPrefix('relative/pfx'), null);
  assert.equal(contextForPrefix(undefined), null);
});
