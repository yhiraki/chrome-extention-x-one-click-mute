---
status: accepted
date: 2026-10-19
issue:
---

# 0006 バージョンの原本は manifest.json にする

## 背景

取り入れた [yhiraki/ai-dev-template](https://github.com/yhiraki/ai-dev-template) のバージョン上げは `package.json` を原本にしている。このリポジトリは Chrome 拡張機能で、Chrome が読み、利用者が `chrome://extensions` で見るのは `manifest.json` の `version` であり、`package.json` は npm のスクリプトを動かすために置くもの。

## 決定

- バージョンの原本は `manifest.json` の `version` とする。
- `package.json` の `version` も同じ値に揃え、`npm run version:patch|minor|major` が両方を書き換えて `chore: bump version to X.Y.Z` でコミットし、`vX.Y.Z` のタグを付ける。
- 書き換えは `version` の行の置換にし、`manifest.json` の配列の書式を変えない（差分を膨らませない）。

## 検討した案

- `package.json` を原本にする案: 拡張の実体と食い違いうるので見送った（タグは正しいのに `chrome://extensions` の表示が古い、という状態が起きる）。
- `manifest.json` だけを上げる案: バージョンが 2 か所でずれるので見送った。
- JSON を組み立て直して書き出す案: `manifest.json` の配列が 1 行ずつに展開されて差分が膨らむので見送った。

## 影響

- リリースノートの下書き（`scripts/release-notes.mjs`）も `manifest.json` から現在のバージョンを読む。
- v1.1.0 以前は手で上げていた（`1.0` と書いていた時期がある）。v1.1.0 からこの手順にする。
