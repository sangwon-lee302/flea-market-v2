# CLAUDE.md

## 前提

ホストに PHP と Composer はない。PHP・Composer・npm・npx はすべて `./vendor/bin/sail` 経由で実行する。コンテナが停止している場合は `sail up -d` から始める。

コマンドの表記は次に揃える。

- `sail test`（`sail artisan test` ではない）
- `sail pint`（検査のみは `sail pint --test`）
- `sail bin phpstan analyse`
- `sail npx prettier --write .`（検査のみは `--check`）
- `sail npm run test`
- `sail composer ide`（IDE ヘルパーを生成する。`_ide_helper.php` は gitignore 対象のため、リポジトリからは存在が見えない）

環境構築の手順は README に書いてある。

## コーディング規約

- コメント・ドキュメント・コミットメッセージ・pull request はすべて日本語で書く。識別子は英語。
- コメントには「なぜ」を書く。コードを読めば分かることは書かない。
- `AppServiceProvider` で `Model::shouldBeStrict()` を有効にしている。次の 3 つが例外になるため、これを前提にコードを書く。
    - リレーションの遅延ロード。`with()` で先に読み込む。
    - 存在しない属性、および `select()` で取得していない属性へのアクセス。
    - `$fillable` にない属性への一括代入。
- `AppServiceProvider` で `Date::use(CarbonImmutable::class)` を設定している。日時オブジェクトは不変であり、`addDay()` などは新しいインスタンスを返す。戻り値を使わないと何も起こらない。
- PHPStan は level 6 で `tests/` も対象にしている。テストコードにも型を書く。
- 整形は Pint（PHP）と Prettier（それ以外）に任せ、手で整形しない。
- テストは `testing` データベースを使う。`phpunit.xml` が `.env` の値を上書きするため、`.env` を編集してもテストの接続先は変わらない。
- Telescope は `dont-discover` に指定し、`AppServiceProvider` が `local` 環境でのみ登録する。
- `.npmrc` で `ignore-scripts=true` を指定しているため、`npm install` では husky のフックが設定されない。
- push する前に、`sail pint --test`・`sail bin phpstan analyse`・`sail test`・`sail npx prettier --check .`・`sail npm run test` をローカルですべて実行する。

## Git の運用

- 変更ごとにブランチを作る。`main` に直接コミットしない。
- ブランチ名は `<type>/<英語のケバブケース>`（例: `docs/write-readme`）。`<type>` は Conventional Commits に合わせる。
- **コミットする前に、コミットメッセージと変更の要約を提示して承認を待つ。** 先にコミットして事後報告しない。
- **pull request をマージしない。** 作成したら URL を報告して止まる。マージはユーザーが手動で行う。
- 1 つのコミットには 1 つの論理的な変更だけを入れる。各コミットの時点で、テストと静的解析が通る状態を保つ。
    - 先例: PR #7 は `chore: IDE Helper を導入` と `chore: User モデルに IDE Helper で PHPDoc を生成` に分けている。差分が 1 ファイルでも、生成された変更は分ける。
- マージ前の修正は `git commit --amend` と `git push --force-with-lease` で行い、修正用のコミットを積まない。

### コミットメッセージ

- 件名は Conventional Commits の type に続けて日本語の体言止め。句点は付けない（例: `docs: README を作成`）。
- 本文は現在形の「〜する。」で始める。過去形にしない。
- 変更が複数ある場合は `-` の箇条書きにし、各項目を体言止めにする。
- 本文ではバッククォートを使わない。
- 末尾に `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` を入れる。

### pull request

常体で書き、次の節をこの順に並べる。

- `## 概要` — 1 文。現在形で「〜のため、〜する。」の形にする。
- `## 変更内容` — 体言止めの箇条書き。句点は付けない。理由は入れ子の箇条書きに書き、そこでは用言で終わってよい。単なる下位項目は体言止めにする。
- `## 補足`（任意）— 注意点や、意図的に採用しなかった選択肢。
- `## 動作確認` — `- [x]` のチェックリスト。観測した事実を現在形で書き、「〜を確認した」とは書かない。件数やステータスコードは括弧で示す。

`## 動作確認` には **CI が保証できないことだけ** を書く。`sail test` や `sail pint --test` が通ることは CI の 4 ジョブが pull request ごとに検証するため書かない。tinker で確かめた実効値、マイグレーションやシーダーの結果、Mailpit に届いたメール、ブラウザでの画面の挙動などを書く。該当するものがなければ節ごと省く。ただし、ツールチェーンや CI 自体を変更する pull request では「ローカルで通る」ことが主張そのものなので、その場合は書く。

本文では識別子をバッククォートで囲み、並列は `・` でつなぐ。括弧は全角の （ ） を使い、半角の ( ) はコードの中だけで使う。末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)` を入れる。

## 決定事項

検討して結論が出ている。ユーザーから改めて指示がない限り蒸し返さない。

- **テストには PHPUnit を使う。** Pest は検討して見送った。歴史の長い PHPUnit を使い続けている既存のプロジェクトが多く、実務での需要が大きいため。Pest 4 では `tests/` を PHPStan の対象に保てないという制約もあったが、判断の主な理由ではない。
- **Rector は導入しない。** 新規のコードベースでは upgrade set が働かず、品質系のルールは Pint と PHPStan に重複する。どうしても必要なら機能の実装後に一度だけ `--dry-run` で監査する方針。

## 参考

旧実装 `~/coachtech/flea-market` は機能の参照先として使ってよい。ただし設定やコミットの流儀は引き継がない。
