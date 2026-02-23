# Project Structure

## Organization Philosophy

pnpm workspaceによるMonorepo構成。`pkgs/` ディレクトリ配下にサービスごとのパッケージを配置する。

## Directory Patterns

### Monorepo Root
**Location**: `/`
**Purpose**: pnpm workspace設定、共通設定ファイル、CI/CD
**Example**: `pnpm-workspace.yaml`, `package.json`, `.github/`

### x402バックエンドサーバー
**Location**: `/pkgs/x402server/`
**Purpose**: 天気予報API + x402支払いゲートウェイ
**Example**: `src/index.ts`, `wrangler.jsonc`, `tsconfig.json`

### MCPサーバー
**Location**: `/pkgs/mcpserver/`
**Purpose**: GPT App連携用MCPサーバー
**Example**: `src/index.ts`, `wrangler.jsonc`, `tsconfig.json`

### 共通パッケージ（検討中）
**Location**: `/pkgs/shared/` (必要に応じて)
**Purpose**: 共通の型定義、ユーティリティ、定数
**Example**: `src/types.ts`, `src/utils.ts`

## Naming Conventions

- **Files**: kebab-case（例: `weather-handler.ts`）
- **Classes/Types**: PascalCase（例: `WeatherResponse`）
- **Functions/Variables**: camelCase（例: `getWeatherForecast`）
- **Constants**: UPPER_SNAKE_CASE（例: `MAX_RETRY_COUNT`）
- **Directories**: kebab-case（例: `weather-api/`）

## Import Organization

```typescript
// 1. External libraries
import { Hono } from 'hono'

// 2. Internal shared packages (将来)
// import { WeatherResponse } from '@repo/shared'

// 3. Local modules
import { handler } from './handler'
```

## Workspace Shortcuts

ルートの `package.json` にフィルタショートカットが定義されている:
```bash
pnpm x402server <command>  # → pnpm --filter x402server <command>
pnpm mcpserver <command>   # → pnpm --filter mcpserver <command>
```

## Code Organization Principles

- 各Cloudflare Workerは独立してデプロイ可能
- ビジネスロジックとルーティングを分離
- テストファイルはソースファイルと同階層（`*.test.ts`）
- Wrangler設定は `wrangler.jsonc`（JSONC形式）を使用
- 環境変数はwrangler.jsoncまたは.dev.varsで管理（ハードコード禁止）

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
