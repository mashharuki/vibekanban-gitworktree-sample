# Technology Stack

## Architecture

pnpm monorepo構成で、2つのCloudflare Workersサービスを管理する。

- **x402バックエンドサーバー**: 天気予報APIを提供し、x402プロトコルによる支払いゲートウェイを統合
- **MCPサーバー**: GPT AppからのリクエストをバックエンドAPIに橋渡しするMCP (Model Context Protocol) サーバー

## Core Technologies

- **Language**: TypeScript（strict mode）
- **Framework**: Hono（両サーバー共通）
- **Runtime**: Cloudflare Workers
- **Package Manager**: pnpm（monorepo管理）

## Key Libraries

- **x402ライブラリ**: HTTP 402 Payment Requiredプロトコルによるステーブルコイン決済
- **GPT App SDK**: GPT Appとの連携インターフェース
- **Hono**: 軽量・高速なWebフレームワーク（Cloudflare Workers最適化）

## Development Standards

### Type Safety
- TypeScript strict mode
- 明示的な型定義を推奨

### Code Quality
- ESLint + Prettier（プロジェクトセットアップ時に設定）
- Conventional Commits形式

### Testing
- Vitest（両サーバー共通）
- TDDアプローチを推奨（AGENTS.mdに準拠）

## Development Environment

### Required Tools
- Node.js 20+
- pnpm 9+
- Wrangler CLI（Cloudflare Workers開発）

### Common Commands
```bash
# 依存関係インストール: pnpm install
# 開発サーバー起動: pnpm dev
# テスト実行: pnpm test
# ビルド: pnpm build
# デプロイ: pnpm deploy
```

## Key Technical Decisions

- **Hono選択理由**: Cloudflare Workersとの親和性が高く、軽量で高速
- **Monorepo選択理由**: バックエンドとMCPサーバーで共通の型定義・ユーティリティを共有
- **Cloudflare Workers**: エッジコンピューティングによる低レイテンシ、グローバル配信

---
_Document standards and patterns, not every dependency_
