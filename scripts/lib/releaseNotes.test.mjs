import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftReleaseNotes, parseLog } from './releaseNotes.mjs';

const SEP = '\x1f';
const END = '\x1e';

test('parseLog は件名と本文に分ける', () => {
  const log = `feat: A${SEP}本文${END}\nfix: B${SEP}${END}\n`;
  assert.deepEqual(parseLog(log), [
    { subject: 'feat: A', body: '本文' },
    { subject: 'fix: B', body: '' },
  ]);
});

test('新しくなったこと、直したこと、閉じた issue に分けて下書きを作る', () => {
  const commits = [
    { subject: 'feat: ミュートのワンクリックボタンを安定させる', body: '' },
    { subject: 'fix: メニュー項目の取り違えを直す', body: '' },
    { subject: 'chore: close issue 0001', body: '# 0001 本物の X で確かめる\n\n## 背景\n...' },
    { subject: 'chore: bump version to 1.1.0', body: '' },
    { subject: 'docs: issue を起こす', body: '' },
  ];
  assert.equal(
    draftReleaseNotes(commits, '1.2.0', '2026-10-19'),
    [
      '---',
      'version: 1.2.0',
      'date: 2026-10-19',
      '---',
      '',
      '## 新しくなったこと',
      '',
      '- ミュートのワンクリックボタンを安定させる',
      '',
      '## 直したこと',
      '',
      '- メニュー項目の取り違えを直す',
      '',
      '<!-- 下書きの材料。利用者向けの言葉に直したら、このコメントごと消す',
      '閉じた issue:',
      '- 0001 本物の X で確かめる',
      '-->',
      '',
    ].join('\n'),
  );
});

test('該当するコミットが無い見出しは出さない', () => {
  const notes = draftReleaseNotes([{ subject: 'fix: 直す', body: '' }], '1.6.1', '2026-10-20');
  assert.ok(!notes.includes('新しくなったこと'));
  assert.ok(notes.includes('- 直す'));
  assert.ok(!notes.includes('閉じた issue'));
});

test('取りやめた issue は材料に入れない', () => {
  const notes = draftReleaseNotes(
    [{ subject: 'chore: cancel issue 0003', body: '# 0003 やめた' }],
    '1.6.1',
    '2026-10-20',
  );
  assert.ok(!notes.includes('0003'));
});
