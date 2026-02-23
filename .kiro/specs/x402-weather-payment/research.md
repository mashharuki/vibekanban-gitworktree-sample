# Research & Design Decisions

## Summary
- **Feature**: `x402-weather-payment`
- **Discovery Scope**: New Feature (greenfield)
- **Key Findings**:
  - x402パッケージは`@x402/hono`（サーバーミドルウェア）と`@x402/fetch`（クライアント）に分離されており、Hono + Cloudflare Workersに直接対応
  - MCPサーバーは`@hono/mcp`ミドルウェアと`@modelcontextprotocol/sdk`を組み合わせ、Streamable HTTP Transportで構築可能
  - サンプルアプリとして天気データはモック/静的データで十分。本番想定時はOpenWeatherMap等の外部APIに差し替え可能な設計にする

## Research Log

### x402プロトコルとTypeScript SDK
- **Context**: x402サーバーサイドの実装方法を調査
- **Sources Consulted**:
  - https://docs.cdp.coinbase.com/x402/welcome
  - https://github.com/coinbase/x402
  - https://developers.cloudflare.com/agents/x402/
  - https://www.npmjs.com/package/@x402/hono
- **Findings**:
  - Coinbaseが開発したオープンプロトコル。HTTP 402 Payment Requiredを活用
  - `@x402/hono`パッケージが`paymentMiddleware`を提供し、Honoルートに決済ゲートを適用
  - `@x402/fetch`がクライアント側のfetchラッパーを提供し、402レスポンスを自動処理
  - `@x402/core`, `@x402/evm`が基盤パッケージ（EVM決済サポート）
  - ファシリテーターURL: `https://x402.org/facilitator`（Coinbase提供の無料ティア: 月1,000件）
  - ネットワーク: Base Sepolia（テストネット）/ Base（メインネット）
  - ウォレット: `viem`の`privateKeyToAccount()`で秘密鍵からアカウント導出
- **Implications**: x402serverはHonoミドルウェアとして統合。環境変数でウォレットアドレスとファシリテーターURLを管理

### MCPサーバーとGPT App連携
- **Context**: ChatGPT Apps SDKとMCPサーバーの構築方法を調査
- **Sources Consulted**:
  - https://developers.openai.com/apps-sdk/build/mcp-server/
  - https://developers.openai.com/apps-sdk/quickstart/
  - https://github.com/honojs/middleware/tree/main/packages/mcp
  - https://github.com/mhart/mcp-hono-stateless
- **Findings**:
  - `@hono/mcp`が`StreamableHTTPTransport`を提供し、Hono + Cloudflare Workersに対応
  - `@modelcontextprotocol/sdk`の`McpServer`でサーバーインスタンスを作成、`.tool()`でツール定義
  - Streamable HTTPはサーバーレス環境（Cloudflare Workers）に推奨されるトランスポート
  - ChatGPTのDeveloper Modeでコネクタを作成し、`/mcp`エンドポイントを登録
  - OpenAI Apps SDKの`registerAppTool`はUI付きアプリ向け。今回はUI不要なので標準MCP toolで十分
- **Implications**: mcpserverは`@hono/mcp` + `@modelcontextprotocol/sdk`で構築。`get_weather`ツールを定義し、内部で`@x402/fetch`を使ってx402serverに決済付きリクエストを送信

### 天気データソース
- **Context**: 天気予報データの取得元を検討
- **Sources Consulted**: サンプルアプリの目的と要件を分析
- **Findings**:
  - サンプルアプリの主目的はx402決済フローのデモンストレーション
  - 外部天気API（OpenWeatherMap等）を使うと、APIキー管理の複雑さが増す
  - モック/静的データで十分にデモ可能。拡張性のためにWeatherServiceインターフェースで抽象化
- **Implications**: 初期実装はモック天気データ。WeatherServiceインターフェースにより外部API差し替え可能

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| レイヤードアーキテクチャ | ルーティング → ミドルウェア → サービス → データ | シンプル、小規模サービスに最適 | 複雑になると層が増える | サンプルアプリの規模に適合 |
| ヘキサゴナル | ポート&アダプターで外部依存を抽象化 | テスト容易、差し替え可能 | 小規模サービスにはオーバーエンジニアリング | WeatherServiceのみポート化で十分 |

**選択**: レイヤードアーキテクチャをベースに、天気データソースのみアダプターパターンで抽象化

## Design Decisions

### Decision: 天気データソースの抽象化
- **Context**: 天気データをどこから取得するか
- **Alternatives Considered**:
  1. 外部天気API（OpenWeatherMap）直接呼び出し
  2. モックデータ + インターフェース抽象化
- **Selected Approach**: モックデータ + WeatherServiceインターフェース
- **Rationale**: サンプルアプリの主目的はx402デモ。外部APIキー管理を避けつつ、将来の拡張を可能に
- **Trade-offs**: リアルデータなし vs セットアップの簡易さ
- **Follow-up**: 本番化時にWeatherServiceの実装を外部API版に差し替え

### Decision: MCPサーバーのx402クライアント統合
- **Context**: mcpserverからx402serverへの決済付きリクエストの送信方法
- **Alternatives Considered**:
  1. `@x402/fetch`で自動決済処理
  2. 手動で402レスポンスを解析し決済ペイロードを構築
- **Selected Approach**: `@x402/fetch`の`wrapFetchWithPayment`を使用
- **Rationale**: プロトコル処理が自動化され、決済フローのエラー処理も内包
- **Trade-offs**: 追加依存パッケージ vs 実装の簡易さ
- **Follow-up**: Cloudflare Workers環境での`viem`互換性を実装時に検証

### Decision: Hono MCPミドルウェアの選択
- **Context**: MCPサーバーをHono上でどう構築するか
- **Alternatives Considered**:
  1. `@hono/mcp` (Hono公式ミドルウェア)
  2. `@modelcontextprotocol/sdk`を直接使用し手動でHTTPハンドリング
- **Selected Approach**: `@hono/mcp`の`StreamableHTTPTransport`を使用
- **Rationale**: Hono公式サポート、Cloudflare Workers互換、Streamable HTTP推奨
- **Trade-offs**: 公式ミドルウェアへの依存 vs 低レベル制御
- **Follow-up**: なし

## Risks & Mitigations
- **Risk 1**: `viem`（ウォレット操作）がCloudflare Workersランタイムで完全互換でない可能性 → 実装時にWorkersバンドルサイズとランタイム互換性を検証
- **Risk 2**: x402テストネット（Base Sepolia）のファシリテーターの可用性 → ローカルテストではx402決済をモック化
- **Risk 3**: `@hono/mcp`がまだ比較的新しいパッケージ → バージョン固定し、MCPプロトコル変更時のアップデートに注意

## References
- [x402 Protocol - Coinbase Developer Docs](https://docs.cdp.coinbase.com/x402/welcome) — プロトコル仕様と実装ガイド
- [x402 GitHub Repository](https://github.com/coinbase/x402) — TypeScript SDKソースコード
- [Cloudflare Workers x402 Guide](https://developers.cloudflare.com/agents/x402/) — Cloudflare Workers統合
- [OpenAI Apps SDK - MCP Server](https://developers.openai.com/apps-sdk/build/mcp-server/) — GPT App MCP統合
- [@hono/mcp](https://github.com/honojs/middleware/tree/main/packages/mcp) — Hono MCPミドルウェア
- [MCP Hono Stateless Example](https://github.com/mhart/mcp-hono-stateless) — Hono + MCP + Cloudflare Workers実例
