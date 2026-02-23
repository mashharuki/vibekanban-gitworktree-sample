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
- Biome（フォーマッター）: `pnpm format` でプロジェクト全体をフォーマット
- Conventional Commits形式

### Testing
- Vitest（両サーバーに導入予定）
- TDDアプローチを推奨（AGENTS.mdに準拠）

## Development Environment

### Required Tools
- Node.js 20+
- pnpm 10+（packageManager: pnpm@10.20.0）
- Wrangler CLI（Cloudflare Workers開発、各パッケージのdevDependenciesに含む）

### Common Commands
```bash
# 依存関係インストール: pnpm install
# フォーマット: pnpm format
# x402server開発: pnpm x402server dev
# mcpserver開発: pnpm mcpserver dev
# x402serverデプロイ: pnpm x402server deploy
# mcpserverデプロイ: pnpm mcpserver deploy
```

## Key Technical Decisions

- **Hono選択理由**: Cloudflare Workersとの親和性が高く、軽量で高速
- **Monorepo選択理由**: バックエンドとMCPサーバーで共通の型定義・ユーティリティを共有
- **Cloudflare Workers**: エッジコンピューティングによる低レイテンシ、グローバル配信

---
_Document standards and patterns, not every dependency_
