# COACHTECH フリマ

[![CI](https://github.com/sangwon-lee302/flea-market-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/sangwon-lee302/flea-market-v2/actions/workflows/ci.yml)

商品の出品と購入ができるフリマアプリケーション。

現在は開発環境とツールチェーンの整備までが完了しており、機能の実装はこれから進める。

## 技術スタック

| 分類           | 内容                           |
| -------------- | ------------------------------ |
| 言語           | PHP 8.5                        |
| フレームワーク | Laravel 13                     |
| データベース   | MySQL 8.4                      |
| フロントエンド | Vite 8・Tailwind CSS 4         |
| 開発環境       | Laravel Sail（Docker Compose） |
| メール         | Mailpit                        |

## 環境構築

Docker が動作する環境があればよく、ホストに PHP や Node.js は必要ない。

```bash
git clone git@github.com:sangwon-lee302/flea-market-v2.git
cd flea-market-v2
```

### 1. 環境変数ファイルを作成する

```bash
cp .env.example .env
```

`compose.yaml` は `${DB_DATABASE}` などを `.env` から読み込む。`.env` がないまま次の手順に進むと MySQL コンテナの起動に失敗するため、最初に作成する。

### 2. 依存パッケージをインストールする

```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install
```

以降の手順で使う `./vendor/bin/sail` 自体が `vendor/` にあるため、この手順だけは Sail を使えない。Composer を含むコンテナを一度だけ起動して `vendor/` を用意する。

アプリケーションの実行環境は PHP 8.5 だが、ここでは PHP 8.4 のイメージを使う。`laravelsail/php85-composer` が公開されていないためであり、`composer.lock` のプラットフォーム要件は PHP 8.4 で満たせる。

### 3. コンテナを起動する

```bash
./vendor/bin/sail up -d
```

### 4. アプリケーションをセットアップする

```bash
./vendor/bin/sail composer setup
```

アプリケーションキーの生成、マイグレーション、フロントエンドのビルドまでを行う。`SESSION_DRIVER` と `CACHE_STORE` が `database` のため、マイグレーションを実行しないとリクエストが失敗する。

### 5. Git フックを有効化する

```bash
./vendor/bin/sail npm run prepare
```

`.npmrc` で `ignore-scripts=true` を指定しているため、`npm install` では `prepare` スクリプトが実行されず、husky のフックが設定されない。クローンごとに一度だけ実行する。

### エイリアス

Sail が用意しているエイリアスを設定すると、`./vendor/bin/sail` を `sail` と書ける。

```bash
alias sail='sh $([ -f sail ] && echo sail || echo vendor/bin/sail)'
```

以降のコマンドはこのエイリアスを前提に表記する。

## アクセス先

| 用途             | URL・接続先                |
| ---------------- | -------------------------- |
| アプリケーション | http://localhost           |
| Mailpit          | http://localhost:8025      |
| Telescope        | http://localhost/telescope |
| MySQL            | 127.0.0.1:3306             |

GUI クライアントから MySQL に接続する場合は、ユーザー `sail`・パスワード `password`・データベース `laravel` を使う。

## 開発用コマンド

| コマンド                      | 説明                              |
| ----------------------------- | --------------------------------- |
| `sail up -d`・`sail down`     | コンテナの起動・停止              |
| `sail npm run dev`            | Vite の開発サーバーを起動         |
| `sail test`                   | PHPUnit を実行                    |
| `sail npm run test`           | Vitest を実行                     |
| `sail pint`                   | PHP を整形（`--test` で検査のみ） |
| `sail bin phpstan analyse`    | Larastan で静的解析               |
| `sail npx prettier --write .` | Blade・JavaScript・CSS などを整形 |
| `sail composer ide`           | IDE ヘルパー用のメタデータを生成  |

## 環境変数

`.env.example` を読めば分かるもの以外で、補足が必要な項目を挙げる。

### ポート

`.env.example` には含まれないが、`compose.yaml` が参照する。ホスト側のポートが埋まっている場合は `.env` に追記する。

| 変数                             | 既定値 | 対象                      |
| -------------------------------- | ------ | ------------------------- |
| `APP_PORT`                       | 80     | アプリケーション          |
| `VITE_PORT`                      | 5173   | Vite                      |
| `FORWARD_DB_PORT`                | 3306   | MySQL                     |
| `FORWARD_MAILPIT_PORT`           | 1025   | Mailpit（SMTP）           |
| `FORWARD_MAILPIT_DASHBOARD_PORT` | 8025   | Mailpit（ダッシュボード） |

### ホスト名

`DB_HOST=mysql` と `MAIL_HOST=mailpit` は Docker ネットワーク内のサービス名であり、コンテナの中からのみ解決できる。ホスト側の GUI クライアントなどから接続する場合は `127.0.0.1` を使う。

### データベース

アプリケーションは `laravel`、テストは `testing` を使う。`testing` は Sail の初期化スクリプトが MySQL コンテナの初回起動時に作成する。`phpunit.xml` が `DB_DATABASE` を含む値を上書きするため、`.env` を書き換えてもテストの接続先は変わらない。

### ロケール

`APP_LOCALE=ja`・`APP_FALLBACK_LOCALE=en`・`APP_FAKER_LOCALE=ja_JP` を指定している。Laravel の既定値から変更しており、日本語の翻訳ファイルは `laravel-lang/common` が提供する。

### Telescope

`.env.example` には含まれない。`TELESCOPE_ENABLED` の既定値は `true` だが、`AppServiceProvider` が `local` 環境でのみサービスプロバイダーを登録するため、それ以外の環境では有効にならない。

### WWWUSER・WWWGROUP

`sail` スクリプトが実行時に設定する。`docker compose` を直接実行すると未設定のままとなり、コンテナが作成するファイルの所有者がホスト側のユーザーと食い違う。

## 品質管理

| ツール          | 対象                                                  |
| --------------- | ----------------------------------------------------- |
| Pint            | PHP の整形（Laravel プリセット）                      |
| Larastan        | 静的解析（レベル 6、`tests` を含む）                  |
| Prettier        | Blade・JavaScript・CSS・Markdown などの整形           |
| PHPUnit・Vitest | テスト                                                |
| commitlint      | Conventional Commits に沿ったコミットメッセージの検査 |

husky で、コミット時に lint-staged による整形を、コミットメッセージの作成時に commitlint による検査を実行する。

GitHub Actions では、`main` への pull request と push に対して static analysis・test・frontend・commitlint の 4 ジョブを並列で実行する。

## AI 支援

Laravel Boost を開発用の依存として入れている。`.mcp.json` が MCP サーバーを登録し、このプロジェクトに入っているバージョンに合わせた Laravel のドキュメントの検索、スキーマやログの参照などを AI エージェントから行える。

ホストに PHP がないため、`.mcp.json` は `php artisan` ではなく `./vendor/bin/sail artisan` を呼ぶ。MCP サーバーはエージェントの起動時に立ち上がるため、**先に `sail up -d` でコンテナを起動しておく**。停止したまま起動すると、サーバーが起動に失敗し、コンテナを起動したあとでエージェントを起動し直すことになる。

生成された AI 向けのガイドラインは取り込まない。`boost:install` は `CLAUDE.md` を書き換えるため実行せず、`.mcp.json` は手で書いている。
