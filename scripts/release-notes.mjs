#!/usr/bin/env node
// 次のバージョンのリリースノートの下書きを docs/releases/X.Y.Z.md に書き出す
// usage: node scripts/release-notes.mjs <patch|minor|major>

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { draftReleaseNotes, parseLog } from './lib/releaseNotes.mjs';
import { nextVersion } from './lib/version.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const type = process.argv[2];
if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('usage: node scripts/release-notes.mjs <patch|minor|major>');
  process.exit(1);
}

// バージョンの原本は manifest.json（docs/adr/0005）
const current = JSON.parse(readFileSync(join(rootDir, 'manifest.json'), 'utf-8')).version;
const next = nextVersion(current, type);

let lastTag = '';
try {
  lastTag = execSync('git describe --tags --abbrev=0', { cwd: rootDir, encoding: 'utf-8', stdio: 'pipe' }).trim();
} catch {}
const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const log = execSync(`git log ${range} --format=%s%x1f%b%x1e`, { cwd: rootDir, encoding: 'utf-8' });
const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

const dir = join(rootDir, 'docs', 'releases');
const file = join(dir, `${next}.md`);
if (existsSync(file)) {
  console.error(`${file} は既にあります。消してから実行してください`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
writeFileSync(file, draftReleaseNotes(parseLog(log), next, date), 'utf-8');
console.log(`${lastTag || '最初'} 以降のコミットから下書きを書き出しました: docs/releases/${next}.md`);
console.log(`利用者向けの言葉に直してから npm run version:${type} を実行してください`);
