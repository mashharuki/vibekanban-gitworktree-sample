# Project Overview

## Purpose
VibeKanban と Git Worktree を組み合わせた、AI駆動の並列開発を試すためのサンプルプロジェクト。題材として、GPT App から天気予報 API を呼び出し、x402 プロトコル経由でステーブルコイン決済を行う構成を想定している。

## Tech Stack (Planned)
- Language: TypeScript (strict)
- Framework: Hono
- Runtime: Cloudflare Workers
- Testing: Vitest
- Monorepo: pnpm workspace

## Repository State (as of 2026-02-23)
- ルート設定ファイルとステアリング文書が中心の初期段階
- `pnpm-workspace.yaml` は `pkgs/*` をワークスペースとして定義
- `pkgs/` 配下の実装パッケージは未作成（空）
- `.kiro/specs/` にアクティブ仕様は未作成

## Key Files
- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `.kiro/steering/product.md`
- `.kiro/steering/tech.md`
- `.kiro/steering/structure.md`
