import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERSION_FILES, nextVersion, replaceVersion } from './version.mjs';

test('nextVersion は種類に応じて上げ、下の桁を 0 に戻す', () => {
  assert.equal(nextVersion('1.2.3', 'patch'), '1.2.4');
  assert.equal(nextVersion('1.2.3', 'minor'), '1.3.0');
  assert.equal(nextVersion('1.2.3', 'major'), '2.0.0');
});

test('nextVersion は知らない種類を拒む', () => {
  assert.throws(() => nextVersion('1.2.3', 'beta'));
});

test('VERSION_FILES は原本の manifest.json を先頭に持つ', () => {
  assert.deepEqual(VERSION_FILES, ['manifest.json', 'package.json']);
});

test('replaceVersion は version の行だけを差し替える', () => {
  const text = [
    '{',
    '  "name": "X One-Click Mute",',
    '  "version": "1.1.0",',
    '  "icons": { "16": "icons/icon16.png" }',
    '}',
    '',
  ].join('\n');
  const expected = text.replace('"1.1.0"', '"1.2.0"');
  assert.equal(replaceVersion(text, '1.2.0'), expected);
});

test('replaceVersion は version が無ければ例外にする', () => {
  assert.throws(() => replaceVersion('{\n  "name": "x"\n}\n', '1.7.0'));
});
