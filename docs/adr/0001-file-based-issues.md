---
status: accepted
date: 2026-10-19
issue:
---

# 0001 issue をリポジトリのファイルで管理し、閉じたら消す

## 背景

要望や課題の置き場所が決まっていないと、機能ごとの経緯が設計書や AI エージェントの memory に散らばる。AI エージェントが issue を読み書きしながら実装を進められる置き場所が要る。

このリポジトリでは、AI と進める開発の運用を [yhiraki/ai-dev-template](https://github.com/yhiraki/ai-dev-template) から取り入れるときに、この決定もそのまま採用した。

## 決定

- issue は `docs/issues/NNNN-slug.md` に 1 件 1 ファイルで書く。
- issue に関わるコミットには、すべて `Issue: NNNN` のトレーラーを付ける。
- 閉じるときは、件名を `chore: close issue NNNN` としたコミットの本文に issue の全文を写し、ファイルを消す。作業ツリーの `docs/issues/` には開いている issue だけが残る。

## 検討した案

- ホスティングサービスの Issues を使う案: コミットと issue の履歴が別の場所に分かれ、AI エージェントがそのまま読み書きできないので見送った。
- 閉じた issue を frontmatter の状態で区別して残す案: 後の issue で覆された判断が作業ツリーに残り、読む人を迷わせるので見送った。
- 閉じた issue を別のフォルダへ移す案: パスが変わって参照が切れ、古い判断が残る点も同じなので見送った。
- git-bug や Backlog.md のような専用ツールを使う案: ファイルと grep と git で足り、ツールが無いと読めない形は避けたいので見送った。
- issue に日付付きの作業メモを書き足していく案: 履歴は git が持つので、本文は今の姿だけにすることにした。

## 影響

- 閉じた issue は `git log --grep` でしか読めない。探し方は `CONTRIBUTING.md` に置く。
- 閉じたファイルが残らないので、次の番号は git の履歴から引く。
- 閉じた issue は書き換えられない。閉じた後に分かったことは、新しい issue か ADR に書く。
