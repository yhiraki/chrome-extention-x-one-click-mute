#!/usr/bin/env node
// manifest.json（原本）と package.json のバージョンを上げてコミットし、タグを付ける
// usage: node scripts/version.mjs <patch|minor|major|tag>

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { VERSION_FILES, nextVersion, replaceVersion } from './lib/version.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { stdio: 'inherit', cwd: rootDir });
const read = (file) => readFileSync(join(rootDir, file), 'utf-8');

const type = process.argv[2];
if (!['patch', 'minor', 'major', 'tag'].includes(type)) {
  console.error('usage: node scripts/version.mjs <patch|minor|major|tag>');
  process.exit(1);
}

const current = JSON.parse(read(VERSION_FILES[0])).version;

if (type === 'tag') {
  git('tag', `v${current}`);
  process.exit(0);
}

const version = nextVersion(current, type);
for (const file of VERSION_FILES) {
  writeFileSync(join(rootDir, file), replaceVersion(read(file), version), 'utf-8');
}
git('add', ...VERSION_FILES);
git('commit', '-m', `chore: bump version to ${version}`);
git('tag', `v${version}`);

console.log(`\n${current} から ${version} に上げ、v${version} のタグを付けました`);
console.log('次のステップ:');
console.log('  git push origin main');
console.log(`  git push origin v${version}`);
