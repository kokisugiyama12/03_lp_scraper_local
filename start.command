#!/bin/bash
# テレアポリスト生成ツール — ワンクリック起動 (macOS)
# このファイルをFinderでダブルクリックすると起動します

set -e
cd "$(dirname "$0")"

echo "================================================"
echo "  テレアポリスト生成ツール"
echo "================================================"
echo ""

# Node.js チェック
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js が見つかりません"
  echo ""
  echo "Node.js (LTS版) を https://nodejs.org からインストールしてください"
  echo ""
  osascript -e 'display alert "Node.js が必要です" message "https://nodejs.org からLTS版をインストールしてから再度起動してください"' 2>/dev/null || true
  read -n 1 -s -r -p "何かキーを押すと閉じます..."
  exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION を検出"

# npm install (初回 or node_modules 不在時)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo ""
  echo "依存パッケージをインストールしています (初回のみ・数分かかります)..."
  npm install
  echo "✓ インストール完了"
fi

# DB 初期化
mkdir -p data

# ブラウザ自動オープン (バックグラウンド)
(
  for i in $(seq 1 60); do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
      sleep 1
      open http://localhost:3000 2>/dev/null
      break
    fi
    sleep 1
  done
) &

echo ""
echo "サーバーを起動しています..."
echo "起動後、自動でブラウザが開きます (http://localhost:3000)"
echo ""
echo "終了するには このウィンドウで Ctrl+C を押してください"
echo "------------------------------------------------"
echo ""

# Next.js dev server を起動
exec npm run dev
