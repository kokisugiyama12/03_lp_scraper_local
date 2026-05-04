# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)。初回起動時にDBマイグレーション自動実行
npm run build        # Production build
npm run lint         # ESLint
npx drizzle-kit generate  # schema.ts変更後、新マイグレーションSQLを drizzle/ に生成
npx drizzle-kit push      # 開発時の高速適用（マイグレーションファイルを使わず直接 schema を反映）

# 開発の前提: ChromeをCDPデバッグモードで起動しておく必要がある
open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

> テスト用スクリプトは `npm` に登録されておらず、リポジトリ直下に `debug-search.mjs` / `debug-test-ads.mjs` がある（`node debug-search.mjs` などで個別実行）。

## Architecture

テレアポ営業向けリスティング広告リスト生成ツール。**ローカル動作専用**（クラウドIPからは Google が広告を返さないため）。PlaywrightでローカルのリアルChrome（CDP接続）を駆動してGoogle検索を自動化し、広告主のURL・電話番号・代表者名を抽出してGoogle Spreadsheetに出力する。AI抽出は `04_teleapo_api`（別プロジェクト）にHTTPS委譲する。

### Data Flow

1. **ユーザー入力**: 業種キーワード + 場所（キーワードに地名含めるモード or 位置エミュレーションモード）+ ページ数（1〜5）
2. **ジョブ作成** (`POST /api/jobs`): DBにジョブ+クエリ行を生成 → オーケストレーターをfire-and-forget
3. **バックグラウンド実行** (`src/lib/services/search-orchestrator.ts`): 各locationで Google検索(Playwright/CDP) → 広告URL抽出 → LP訪問+テキスト取得 → **3段階抽出**（後述）→ DB保存 + SSE通知
4. **リアルタイム表示**: SSE (`/api/jobs/[id]/stream`) でフロントにイベント配信
5. **エクスポート**: Google OAuth (ブラウザフロー) → Google Sheets API でSpreadsheetに出力（追記モード対応）

### 3段階抽出ロジック (`search-orchestrator.ts`)

1. **Step 1**: LP本文を取得 → `extractContactInfo` で会社名・電話・代表者名を抽出
2. **Step 2** (Step1が不足時): 同ドメイン内の会社概要ページを `scrapeCompanyPages` で巡回 → LPテキストと結合して再抽出
3. **Step 3** (会社名のみ取れた時): `searchCompanyPhone` でGoogle検索 → 検索結果テキストから電話番号のみ補完

抽出結果のステータスは `success` / `partial` / `failed` で記録される。

### Key Layers

- **DB**: SQLite (better-sqlite3) + Drizzle ORM。Schema at `src/lib/db/schema.ts`、マイグレーションSQL at `drizzle/`、DB file at `data/teleapo.db`（WALモード）。`getDb()` で初回呼び出し時に lazy 初期化（`data/` ディレクトリ自動作成 + `migrate()` で `drizzle/` 配下のマイグレーションを自動適用）。schema 変更時は `npx drizzle-kit generate` で新SQLを追加するだけで、次回起動時に自動反映される
- **Scraper**: `src/lib/scraper/` — Playwright が `chromium.connectOverCDP("http://localhost:9222")` でユーザーの実Chromeに接続。`browser.ts` がシングルトン管理。`google-search.ts` は通常検索 + 位置エミュレーション(X-Geoヘッダー) + 1〜5ページ取得をサポート
- **AI**: `src/lib/ai/extract-contact.ts` — `04_teleapo_api` の `/api/ai/extract` にLPテキストを POST（`x-license-key` ヘッダー認証）。**Gemini APIキーは本リポジトリには持たない**（04側で管理）。失敗時は正規表現フォールバック。**呼び出し間に4秒の rate limit** を強制
- **Phone Selection**: `selectBestPhone()` がクライアント側で電話番号を選定。優先順位: ①検索地域の市外局番に一致する固定電話 → ②任意の固定電話 → ③フリーダイヤル(0120/0800)。地域判定は `src/lib/config/area-codes.ts` の市外局番⇄都道府県マッピングで行う
- **Google Sheets**: `src/lib/api/google-sheets.ts` — googleapis + **OAuth 2.0**（サービスアカウントではない）。トークンは `oauth_sessions` テーブルに保存。`exportHistory` テーブルでエクスポート済みSpreadsheetを記憶し追記モードで動作
- **Event Bus**: `src/lib/services/event-bus.ts` — Node EventEmitter でSSE配信。フロントは `/api/jobs/[id]/stream` を購読
- **Location Data**: `src/lib/config/` — `areas.ts`(エリア), `train-lines.ts`(JR/メトロ/都営の駅名), `prefectures.ts`(47都道府県+政令市), `uule.ts`(位置エミュレーション用)

### Environment Variables

`TELEAPO_API_BASE` + `TELEAPO_LICENSE_KEY` が必須（AI抽出を委譲するバックエンドURLと `tlap_` で始まるライセンス）。`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` はSpreadsheet出力に必要。`NEXT_PUBLIC_BASE_URL`（OAuthコールバック、デフォルト `http://localhost:3000`）。`.env.example` 参照。

### Notes

- `serverExternalPackages: ["better-sqlite3", "playwright"]` in next.config.ts（Next.jsのバンドルから除外）
- Google広告の検出セレクタ (`#tads` / `#tadsb`, `[data-text-ad]`, `aria-label="広告"`, `スポンサー`ラベル) はGoogle側の変更で壊れる可能性あり。`/aclk` 計測URLはスキップして広告主サイトに直接アクセス
- 検索クエリ間に 3〜8秒、抽出間に 0.5〜1.5秒のランダム遅延でブロック回避
- ジョブの `status === "cancelled"` は各クエリ実行前にチェック（途中キャンセル可能）
- `closeBrowser()` はジョブ完了時に呼ばれるが、CDP接続のため実Chrome自体は閉じない（リスナー解除のみ）
- Tailwind CSS v4（PostCSS経由）、日本語UIアプリ（lang="ja"）、Next.js 16 App Router、React 19
