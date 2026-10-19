# Contributing

このドキュメントは、このプロジェクトへのコントリビューション方法を説明します。人も AI エージェントも同じ手順に従います。

issue・ADR・設計書・リリースノートをリポジトリ内のファイルと git の履歴で管理する形は、[yhiraki/ai-dev-template](https://github.com/yhiraki/ai-dev-template) の運用を取り入れています（理由は `docs/adr/0001` と `docs/adr/0002`）。

## Issue の管理

作業ツリーには今の姿だけを置き、経緯は git に残します。`docs/issues/` にあるのは開いている issue だけで、閉じた issue はコミットメッセージに全文を写して消します。

### 仕様の置き場所

- `docs/design.md` には、目的、画面の大まかな構成、設定とアセットの扱い、API、認証、配備のような、めったに変わらない抽象的な内容だけを書きます。
- 細かい振る舞いの原本はコードとテストです。issue で決めた振る舞いは、必ずテストで守ります。
- 後の作業を縛る決定は ADR に書いて残し続けます。一つの issue の中で閉じる判断、検討した案、やらないことは issue に書き、閉じたあとはコミットメッセージに残ります。

### 開く

- `docs/issues/NNNN-slug.md` に 1 件 1 ファイルで書きます。`docs/issues/_template.md` を写して作り、frontmatter と見出しの並びはそのまま使います。
- 番号は、これまでに使った最大の番号に 1 を足した 4 桁です。閉じた issue のファイルは残らないので、最大の番号は git から引きます。

  ```bash
  { ls docs/issues; git log --format=%B; } | grep -oE '(^Issue: |^)[0-9]{4}' | grep -oE '[0-9]{4}' | sort -u | tail -1
  ```

  PowerShell なら次のとおりです。

  ```powershell
  $nums = @(Get-ChildItem docs/issues -Filter '[0-9]*.md' -Name | ForEach-Object { [int]$_.Substring(0, 4) }) +
          @(git log --format=%B | Select-String -Pattern '^Issue: (\d{4})$' | ForEach-Object { [int]$_.Matches[0].Groups[1].Value })
  '{0:D4}' -f (($nums | Measure-Object -Maximum).Maximum + 1)
  ```

- モックやチャットなど、あとで消えたり見られなくなったりするものへのリンクは載せません。そこで決まったことは issue の本文に書き写します。

### 書く

- 完了の条件はチェックボックスで書き、満たしたものから印を付けます。すべてに印が付いたら閉じられます。
- 完了の条件には、決めた振る舞いをテストで確かめる項目を必ず置きます。
- 完了の条件には、書く ADR の項目を必ず置きます。ADR を書くなら「ADR を書いた: 〜という決定」、書かないなら「ADR なし」と書きます。
- 完了の条件の最後には、issue を作る時点で `docs/design.md` のどの章に関わるかを書いた項目を必ず置きます。関わる章があれば「5 章 API に〜を足した」のように章と変更を書き、なければ「design.md に関わる変更なし」と書きます。
- 未検証の点は「実機で〜を確かめた」のような確認項目として完了の条件に、保留した判断は未決事項に書きます。実機で分かった事実は、それが影響する節を今の姿に書き換えて反映します。
- issue に関わるコミットには、すべてメッセージの末尾に `Issue: NNNN` のトレーラーを付けます。`git commit --trailer "Issue: NNNN"` で付けられます。複数の issue に関わるコミットには行を分けて並べます。

### 閉じる

実装を終えたら、実装とは別のコミットで issue のファイルを消します。件名は `chore: close issue NNNN`、本文には frontmatter を除いた issue の全文を写し、末尾に `Issue: NNNN` を付けます。実装せずに取りやめるときも同じ手順で、件名を `chore: cancel issue NNNN` にし、本文の先頭に取りやめた理由を書きます。

```
chore: close issue 0001

# 0001 検索結果を速く出す

## 背景
...

Issue: 0001
```

### 探す

```bash
# 開いている issue
ls docs/issues/[0-9]*.md
# 閉じた issue の全文
git log --grep='^chore: \(close\|cancel\) issue 0001$'
# issue 0001 に関わるコミットと差分
git log -p --reverse --grep='^Issue: 0001$'
# 閉じた issue の本文を語句で探す
git log --grep='^chore: \(close\|cancel\) issue' --grep='逆引き' --all-match
# 各コミットがどの issue に属するか
git log --format='%h %s [%(trailers:key=Issue,valueonly,separator=%x2C)]'
```

## ADR の管理

後の作業を縛る決定は `docs/adr/NNNN-slug.md` に 1 件 1 ファイルで書き、消さずに残し続けます。番号は issue とは別に振り、`docs/adr/` にある最大の番号に 1 を足した 4 桁です。`docs/adr/_template.md` を写して作ります。

- 次のどれかに当てはまる決定を ADR にします。
  - この先の issue がその決定に従う必要がある。
  - 覆すと何か所にも響き、戻すのに手間がかかる。
  - 却下した案が、また提案されそうである。
- 一つの issue の中で閉じる選択は ADR にせず、issue の「検討した案」に書きます。
- 1 件の ADR には 1 つの決定だけを書きます。
- frontmatter の `issue` には、その決定を生んだ issue の番号を書きます。issue から生まれていなければ空にします。
- `status` は `accepted`、`superseded`、`deprecated` のいずれかです。決まったあとは本文を書き換えず、決定を変えるときは新しい ADR を書いて、古い ADR を `status: superseded` にし、`superseded_by: NNNN` を足します。決定そのものが要らなくなったときは `status: deprecated` にします。
- 有効な ADR は `grep -l "^status: accepted" docs/adr/[0-9]*.md` で一覧できます。

## コミット

- 件名は `feat:` `fix:` `docs:` `chore:` `refactor:` `test:` のいずれかで始め、続けて何のために何をしたかを一文で書きます。「〜できるよう、〜する」のように目的を先に置きます。
- `feat:` と `fix:` の件名はリリースノートの下書きの材料になるので、利用者から見た変化を書きます。
- 1 つのコミットには 1 つの論理的な変更だけを入れます。issue を開く、実装する、閉じるはそれぞれ別のコミットにします。

## バージョン管理

バージョンの原本は `manifest.json` の `version` です（Chrome が読み、利用者が `chrome://extensions` で見る値だからです。`docs/adr/0005`）。ルートの `package.json` の `version` も同じ値に揃えます。`npm run version:*` は両方を書き換えます。

### リリースノート

利用者向けの更新の内容は `docs/releases/X.Y.Z.md` に書きます。バージョンを上げる前に次の順で用意します。

1. `npm run release-notes:minor` のように、これから上げる種類を付けて実行すると、前回のタグ以降の `feat:` と `fix:` のコミットから `docs/releases/X.Y.Z.md` に下書きができる。
2. 下書きを利用者向けの言葉に直す。末尾の HTML コメントは材料なので、使い終えたら消す。利用者に関係しない項目も消す。
3. `git add docs/releases/X.Y.Z.md` でステージしてから、同じ種類の `npm run version:minor` を実行する。バージョンを上げるコミットに、リリースノートも入る。

### バージョンを上げる

- `npm run version:patch` / `version:minor` / `version:major` は、`manifest.json` と `package.json` を書き換え、`chore: bump version to X.Y.Z` でコミットし、`vX.Y.Z` のタグを付けます。
- `npm run version:tag` は、今のバージョンにタグだけを付けます。
- 終わったら `git push origin main` と `git push origin vX.Y.Z` でコミットとタグを送ります。

## テスト

- 新しい関数やロジックは、先に失敗するテストを書いてから実装します。
- `scripts/` のテストは `npm run test:scripts` で走らせます。
- 画面の挙動は、X の DOM を模したページに `content.js` を注入して確かめます（Playwright）。本物のタイムラインはログインが要るので確かめられません。未確認の点は issue の未決事項に残します。
