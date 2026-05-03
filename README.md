# テレアポリスト生成ツール

広告代理店の営業チーム向けリード生成ツール。Google検索のリスティング広告（スポンサー枠）を自動検索し、広告主のURL・電話番号・代表者名を抽出してGoogle Spreadsheetに出力する。

## 機能

- **業種 + エリア/駅名のローラー検索**: 「美容院」+「五反田駅」「恵比寿駅」...のように業種キーワードと複数の場所を指定して一括検索
- **リスティング広告の自動検出**: Google検索結果からスポンサー広告のURLを抽出（広告クリックは行わず、DOM読み取りのみ）
- **AI連絡先抽出**: 広告主サイトをスクレイピングし、Gemini 2.0 Flash で電話番号・代表者名・会社名を構造化抽出
- **リアルタイム進捗表示**: SSE (Server-Sent Events) でジョブの進行状況をリアルタイムにUI表示
- **Google Spreadsheet出力**: 検索結果をワンクリックでスプレッドシートにエクスポート

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) / React 19 / TypeScript |
| スタイリング | Tailwind CSS v4 (PostCSS) |
| DB | SQLite (better-sqlite3) + Drizzle ORM |
| スクレイピング | Playwright (CDP接続でリアルChrome使用) |
| AI抽出 | Google Gemini 2.0 Flash (@google/generative-ai) |
| スプレッドシート | Google Sheets API (googleapis) |

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして値を設定:

```bash
cp .env.example .env.local
```

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `GEMINI_API_KEY` | Gemini API (連絡先抽出) | 必須 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Sheets出力 | Sheets出力時のみ |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Google Sheets出力 | Sheets出力時のみ |

### 3. Chromeをデバッグモードで起動

Playwrightはリアルなブラウザに接続するため、Chromeをリモートデバッグ付きで起動する必要がある:

```bash
open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

### 4. DBセットアップ

```bash
npx drizzle-kit push
```

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

## 使い方

1. ダッシュボードで業種キーワード（例: 「ジム」「美容院」）を入力
2. 「路線から選択」または「エリアから選択」でロケーションを選ぶ
3. 「検索開始」でジョブを実行
4. リアルタイムで進捗を確認。完了後、結果テーブルにURL・電話番号・代表者名が表示される
5. 必要に応じてGoogle Spreadsheetにエクスポート

## アーキテクチャ

```
ユーザー入力 (キーワード + 場所)
    ↓
POST /api/jobs → DBにジョブ作成
    ↓
search-orchestrator (バックグラウンド実行)
    ├── Google検索 (Playwright CDP) → 広告URLをDOM読み取りで抽出
    ├── 広告主サイトに直接アクセス → テキスト抽出
    ├── Gemini AI → 電話番号・代表者名を構造化抽出
    ├── DB保存 + SSEでリアルタイム通知
    └── 次の検索へ (3-8秒のランダム遅延)
    ↓
GET /api/jobs/[id]/stream (SSE) → フロントエンドに進捗配信
    ↓
POST /api/jobs/[id]/export → Google Spreadsheetに出力
```

## 広告検出の仕組み

広告のクリックは一切行わず、検索結果ページのDOMを読み取ってURLを抽出する:

1. `#tads` / `#tadsb` コンテナ内の `[data-text-ad]` 要素から外部リンクを読み取り
2. フォールバック: `aria-label="広告"` 領域から抽出
3. フォールバック: 「スポンサー」ラベルの親要素を辿って抽出

Google広告のクリック計測URL (`/aclk`) は明示的にスキップし、広告主サイトには直接アクセスする。

## 対応エリア・路線

- **エリア**: 東京23区、東京市部、神奈川、埼玉、千葉、大阪
- **路線**: JR (山手線・中央線・総武線・京浜東北線)、東京メトロ全9路線、都営地下鉄全4路線

## 現在のステータス

- [x] プロジェクト雛形・設定ファイル
- [x] DBスキーマ・CRUD
- [x] UI (検索フォーム・ジョブ一覧・進捗表示・結果テーブル)
- [x] エリア・路線データ
- [x] Playwright スクレイパー (CDP接続)
- [x] Google広告検出ロジック (3段階フォールバック)
- [x] Gemini AI 連絡先抽出
- [x] SSE リアルタイム進捗
- [x] Google Sheets エクスポート
- [ ] エンドツーエンド動作テスト・調整
