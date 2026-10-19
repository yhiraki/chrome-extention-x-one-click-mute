// バージョンの計算と、同じバージョンを持たせるファイルの操作
//
// 原本は manifest.json。Chrome が読み、利用者が chrome://extensions で見る値なので、
// package.json は同じ値に追従させる（docs/adr/0005）。

export const VERSION_FILES = ['manifest.json', 'package.json'];

export function nextVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

/**
 * ファイルの本文の version の行だけを差し替える。
 * JSON を組み立て直すと manifest.json の配列の書式まで変わって差分が膨らむため、
 * 行の置換にしてある。version が見つからなければ例外にする。
 */
export function replaceVersion(text, version) {
  const next = text.replace(/^(\s*)"version"[ \t]*:[ \t]*"[^"]*"/m, `$1"version": "${version}"`);
  if (next === text) throw new Error('version の行が見つかりません');
  return next;
}
