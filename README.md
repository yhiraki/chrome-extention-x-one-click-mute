# X One-Click Mute

X（Twitter）のタイムラインのポストのアクションバーに、**ワンクリックで「ミュート」「このポストに興味がない」** を実行するボタンを足す Chrome 拡張機能です（Manifest V3）。

X の「…」メニューを開いて項目を探す 2 クリックを、1 クリックにします。

- 🚫 **ミュート** — そのポストの投稿者をミュート
- ⊖ **このポストに興味がない** — そのポストをおすすめから除外

---

## インストール

1. Chrome で `chrome://extensions` を開く
2. 右上の「デベロッパー モード」を ON にする
3. 「パッケージ化されていない拡張機能を読み込む」で、このフォルダを選ぶ
4. X（`https://x.com/` または `https://twitter.com/`）を再読み込みする

---

## 使い方

ポストの下のアクションバー（返信・リポスト・いいね・「…」が並ぶところ）の右端に、ボタンが 2 つ増えます。

- 押すとボタンが淡くなり、実行できたら短く緑になります。
- 失敗したときは、画面の下に赤いトーストで理由が出ます（開いていたメニューの項目名も出るので、X 側の文言が変わったときに気付けます）。
- キーボードの Enter / Space でも押せます（Tab で移動できます）。

設定はありません。常に両方のボタンが出ます。

---

## 仕組み

X の内部 API は使わず、**X 自身の「…」メニューを開いて項目をクリック**しています（X 側の処理に任せるほうが、認証や確認画面の扱いを自前で持たずに済むため）。

1. ポストのアクションバーにボタンを注入する（画面の追加・スクロールを監視して、足りないポストに足す）
2. 押されたら、そのポストの「…」をクリックしてメニューを開く
3. `[role="menuitem"]` の中から、`data-testid` → 文言の完全一致 → 部分一致の順に目的の項目を探してクリックする

取り違えを防ぐための工夫:

- 文言は正規化（大文字小文字・空白・記号・引用符を落とす）して比べます
- `ミュート解除` `Unmute` のような除外語に当たる項目は選びません
- 日本語・英語・韓国語・中国語・スペイン語・ポルトガル語・フランス語・ドイツ語ほかに対応しています（`content.js` の `ACTIONS`）
- 連打してもメニューを取り合わないよう、操作は順番に処理します

---

## ファイル構成

```
chrome-extention-x-one-click-mute/
├── manifest.json         拡張機能の定義（Manifest V3）
├── content.js            X に注入されるメイン処理
├── styles.css            ボタン・トーストのスタイル
├── icons/                アイコン（icon16/32/48/128.png）
├── tools/
│   └── make-icons.ps1    アイコンを再生成するスクリプト
│
├── AGENTS.md             AI エージェントへの指示
├── CLAUDE.md
├── CONTRIBUTING.md       進め方（issue・ADR・コミット・バージョン・テスト）
├── package.json          バージョンとスクリプト
├── scripts/              リリースノートとバージョン上げ
└── docs/
    ├── design.md         設計書
    ├── issues/           開いている issue（閉じたらコミットメッセージに写して消す）
    ├── adr/              決定の記録
    └── releases/         利用者向けの更新の内容
```

アイコンを作り直したいとき:

```powershell
powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
```

---

## うまく動かないとき

**ボタンが出ない**
- X を再読み込みしてください。拡張機能を更新したときは、`chrome://extensions` で再読み込みしてから X を再読み込みします。
- X の DOM が変わった可能性があります。DevTools のコンソール（F12）で `[X-OneClick]` の警告を確認してください。

**「メニューにありません [項目名 / 項目名 ...]」と出る**
- X 側の文言が変わったか、対応していない表示言語です。トーストに出た項目名を `content.js` の `ACTIONS` に足せば直ります（`data-testid` が分かればそちらを優先して使います）。

**押しても何も起きない**
- ログインしていないと実行できません。X にログインしてから押してください。

---

## 開発

進め方は [`CONTRIBUTING.md`](CONTRIBUTING.md) にあります（issue は `docs/issues/`、決定は `docs/adr/`、設計は `docs/design.md`、更新の内容は `docs/releases/`）。

```powershell
npm run test:scripts        # scripts/ のテスト

# バージョンを上げる（リリースノートを先に用意する）
npm run release-notes:minor # docs/releases/X.Y.Z.md に下書きを作る
git add docs/releases/X.Y.Z.md
npm run version:minor       # manifest.json と package.json を上げてコミットし、タグを付ける
git push origin main
git push origin vX.Y.Z
```

バージョンの原本は `manifest.json` です（`package.json` は同じ値に揃えます）。

---

## 注意

- X の UI 変更によって動作しなくなる可能性があります。
- 実行結果は X のアカウントに反映されます。やり直したい場合は X 側の設定やミュート一覧から戻してください。
- この拡張機能は個人利用を想定した非公式ツールです。
