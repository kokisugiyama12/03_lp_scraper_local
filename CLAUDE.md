# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx drizzle-kit push # Apply schema changes to SQLite DB
npx playwright install chromium  # Install browser for scraping
```

## Architecture

テレアポ営業向けリスティング広告リスト生成ツール。PlaywrightでGoogle検索を自動化し、広告主のURL・電話番号・代表者名をGemini AIで抽出してGoogle Spreadsheetに出力する。

### Data Flow

1. **ユーザー入力**: 業種キーワード + 場所（エリア or 路線駅名）+ Spreadsheet URL
2. **ジョブ作成** (`POST /api/jobs`): DBにジョブ+クエリ行を生成 → オーケストレーターをfire-and-forget
3. **バックグラウンド実行** (`src/lib/services/search-orchestrator.ts`): 各locationで Google検索(Playwright) → 広告URL抽出 → LP訪問+テキスト取得 → Gemini 2.0 Flash で電話番号・代表者名抽出 → DB保存 + SSE通知
4. **リアルタイム表示**: SSE (`/api/jobs/[id]/stream`) でフロントにイベント配信
5. **エクスポート**: Google Sheets API (サービスアカウント) でSpreadsheetに出力

### Key Layers

- **DB**: SQLite (better-sqlite3) + Drizzle ORM。Schema at `src/lib/db/schema.ts`、DB file at `data/teleapo.db`。Lazy initialization via Proxy。
- **Scraper**: `src/lib/scraper/` — Playwright Chromium でGoogle検索広告を検出、LPのテキスト抽出
- **AI**: `src/lib/ai/` — Gemini 2.0 Flash で電話番号・代表者名を構造化抽出。APIキーなしの場合は正規表現フォールバック
- **Google Sheets**: `src/lib/api/google-sheets.ts` — googleapis + サービスアカウント認証
- **Event Bus**: `src/lib/services/event-bus.ts` — EventEmitter でSSEイベント配信
- **Location Data**: `src/lib/config/areas.ts`, `train-lines.ts` — 東京23区・市部・近県のエリア + JR・メトロ・都営の路線駅名

### Environment Variables

`GEMINI_API_KEY` が必須（AI抽出用）。`GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` はSpreadsheet出力に必要。`.env.example` 参照。

### Notes

- `serverExternalPackages: ["better-sqlite3", "playwright"]` in next.config.ts
- Google広告の検出セレクタ (`[data-text-ad]`, `#tads`, `スポンサー`ラベル) はGoogle側の変更で壊れる可能性あり
- 検索間に3-8秒のランダム遅延でブロック回避
- Tailwind CSS v4（PostCSS経由）、日本語UIアプリ（lang="ja"）
