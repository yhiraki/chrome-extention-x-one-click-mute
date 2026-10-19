// リリースノートの下書きを、前回のタグ以降のコミットから組み立てる

export const FIELD_SEP = '\x1f';
export const RECORD_SEP = '\x1e';

/** `git log --format=%s%x1f%b%x1e` の出力をコミットの一覧にする */
export function parseLog(log) {
  return log
    .split(RECORD_SEP)
    .map((record) => record.replace(/^\n/, ''))
    .filter((record) => record.trim() !== '')
    .map((record) => {
      const [subject, body = ''] = record.split(FIELD_SEP);
      return { subject: subject.trim(), body: body.trim() };
    });
}

const stripPrefix = (subject) => subject.replace(/^\w+(\([^)]*\))?!?:\s*/, '');

export function draftReleaseNotes(commits, version, date) {
  const features = commits.filter((c) => /^feat(\(|!|:)/.test(c.subject)).map((c) => stripPrefix(c.subject));
  const fixes = commits.filter((c) => /^fix(\(|!|:)/.test(c.subject)).map((c) => stripPrefix(c.subject));
  const closed = commits
    .filter((c) => /^chore: close issue \d{4}$/.test(c.subject))
    .map((c) => (c.body.split('\n').find((line) => line.startsWith('# ')) ?? '').replace(/^# /, ''))
    .filter(Boolean);

  const lines = ['---', `version: ${version}`, `date: ${date}`, '---', ''];
  const section = (title, items) => {
    if (items.length === 0) return;
    lines.push(`## ${title}`, '', ...items.map((item) => `- ${item}`), '');
  };
  section('新しくなったこと', features);
  section('直したこと', fixes);
  if (closed.length > 0) {
    lines.push(
      '<!-- 下書きの材料。利用者向けの言葉に直したら、このコメントごと消す',
      '閉じた issue:',
      ...closed.map((title) => `- ${title}`),
      '-->',
      '',
    );
  }
  return lines.join('\n');
}
