# Requirements Document

## Introduction

本ドキュメントは、x402プロトコルによるステーブルコイン決済付き天気予報APIと、GPT App（ChatGPT）からアクセスするためのMCPサーバーの要件を定義する。

x402はCoinbaseが開発したオープンペイメントプロトコルで、HTTP 402 Payment Requiredステータスコードを活用し、クライアント（人間・AIエージェント問わず）がAPI呼び出し時に自動的にステーブルコイン決済を行う仕組みである。MCPサーバーはModel Context Protocolに基づき、ChatGPTのApps SDKを通じてツールを公開する。

**システム構成:**
- **x402server**: 天気予報API + x402決済ゲートウェイ（Hono + Cloudflare Workers）
- **mcpserver**: GPT App連携用MCPサーバー（Hono + Apps SDK + Cloudflare Workers）

## Requirements

### Requirement 1: 天気予報APIの提供
**Objective:** As a MCPサーバー（またはAPIクライアント）, I want 都市名を指定して天気予報データを取得したい, so that GPT Appのチャットインターフェースから天気情報をユーザーに提供できる

#### Acceptance Criteria
1. When クライアントが都市名を指定して天気予報エンドポイントにGETリクエストを送信した場合, the x402server shall 該当都市の天気予報データ（天気状態、気温、湿度を含む）をJSON形式で返却する
2. When リクエストに都市名パラメータが含まれていない場合, the x402server shall 400 Bad Requestステータスとエラーメッセージを返却する
3. When 指定された都市名に対応する天気データが見つからない場合, the x402server shall 404 Not Foundステータスとエラーメッセージを返却する
4. The x402server shall 天気予報レスポンスに都市名、天気状態、気温（摂氏）、湿度（パーセント）を含める

### Requirement 2: x402プロトコルによる決済統合
**Objective:** As a APIプロバイダー, I want 天気予報APIの呼び出しごとにステーブルコイン決済を自動的に要求したい, so that APIアクセスに対してマイクロペイメントを受け取れる

#### Acceptance Criteria
1. When クライアントが有効な決済情報なしで天気予報エンドポイントにリクエストを送信した場合, the x402server shall HTTP 402 Payment Requiredステータスと`PAYMENT-REQUIRED`ヘッダー（支払い指示を含む）を返却する
2. When クライアントが`PAYMENT-SIGNATURE`ヘッダーに有効な決済ペイロードを含めてリクエストを送信した場合, the x402server shall ファシリテーターを通じて決済を検証し、検証成功後に天気予報データを返却する
3. If ファシリテーターによる決済検証が失敗した場合, the x402server shall 402 Payment Requiredステータスと決済失敗の理由を示すエラーメッセージを返却する
4. The x402server shall x402ライブラリを使用してx402プロトコルの決済フローを実装する

### Requirement 3: MCPサーバーによるGPT App連携
**Objective:** As a GPT Appユーザー, I want チャットインターフェースから自然言語で天気予報を問い合わせたい, so that 直接APIを呼び出さずに天気情報を取得できる

#### Acceptance Criteria
1. The mcpserver shall Model Context Protocol (MCP) に準拠した`/mcp`エンドポイントを公開する
2. The mcpserver shall `get_weather`ツールを定義し、都市名を入力パラメータとして受け付ける
3. When ChatGPTが`get_weather`ツールを呼び出した場合, the mcpserver shall x402serverの天気予報エンドポイントにx402決済付きリクエストを送信し、取得した天気データをMCPレスポンス形式で返却する
4. When x402serverへのリクエストで402レスポンスを受け取った場合, the mcpserver shall x402プロトコルに従い決済ペイロードを構築してリクエストを再送する
5. The mcpserver shall ツール定義にタイトル、説明、入力スキーマを含めてChatGPTに正しく表示されるようにする

### Requirement 4: エラーハンドリングと耐障害性
**Objective:** As a 開発者, I want 各サービスが適切にエラーを処理したい, so that 障害時にも有用なフィードバックが得られ、デバッグが容易になる

#### Acceptance Criteria
1. If x402serverが外部天気データソースからデータ取得に失敗した場合, the x402server shall 503 Service Unavailableステータスと再試行を促すエラーメッセージを返却する
2. If mcpserverがx402serverへの接続に失敗した場合, the mcpserver shall MCPエラーレスポンスとして接続失敗のメッセージを返却する
3. If mcpserverがx402決済処理中にエラーが発生した場合, the mcpserver shall 決済エラーの詳細を含むMCPエラーレスポンスを返却する
4. The x402server shall すべてのAPIレスポンスに一貫したエラーレスポンス構造（statusCode、message フィールド）を使用する

### Requirement 5: 開発環境とテスト
**Objective:** As a 開発者, I want ローカル開発環境でサービスの動作を確認・テストしたい, so that デプロイ前に品質を担保できる

#### Acceptance Criteria
1. The x402server shall Wranglerの`dev`コマンドでローカル開発サーバーを起動できる
2. The mcpserver shall Wranglerの`dev`コマンドでローカル開発サーバーを起動できる
3. The x402server shall VitestによるユニットテストでAPIエンドポイントの動作を検証できる
4. The mcpserver shall Vitestによるユニットテストでツール定義とリクエスト処理の動作を検証できる
5. The x402server shall 環境変数（ウォレットアドレス、ファシリテーターURL等）を`.dev.vars`または`wrangler.jsonc`で管理し、ソースコードにハードコードしない

### Requirement 6: デプロイメント
**Objective:** As a 開発者, I want 各サービスをCloudflare Workersにデプロイしたい, so that グローバルに低レイテンシでサービスを提供できる

#### Acceptance Criteria
1. The x402server shall `wrangler deploy`コマンドでCloudflare Workersにデプロイできる
2. The mcpserver shall `wrangler deploy`コマンドでCloudflare Workersにデプロイできる
3. The x402server shall デプロイ後にヘルスチェックエンドポイント（`/`）でサービスの稼働を確認できる
4. The mcpserver shall デプロイ後にヘルスチェックエンドポイント（`/`）でサービスの稼働を確認できる
