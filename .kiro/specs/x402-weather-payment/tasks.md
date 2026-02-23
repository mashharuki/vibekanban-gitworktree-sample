# Implementation Plan

- [ ] 1. (P) x402server プロジェクト基盤セットアップ
  - x402関連パッケージ（`@x402/hono`, `@x402/core`, `@x402/evm`）とVitestをx402serverに追加する
  - TypeScript設定（`tsconfig.json`）でstrict modeを有効化し、Cloudflare Workers互換の設定にする
  - Vitest設定ファイルを作成し、テスト実行環境を整える
  - 環境変数テンプレート（`.dev.vars.example`）を作成し、`SERVER_WALLET_ADDRESS`と`FACILITATOR_URL`の定義場所を明示する
  - `wrangler.jsonc`にnodejs_compat互換フラグを追加する（x402/viemライブラリが必要とする場合）
  - _Requirements: 5.1, 5.3, 5.5_

- [ ] 2. x402server 天気予報サービスとAPI実装
- [ ] 2.1 WeatherServiceとモック天気データの実装
  - 天気データの型定義（都市名、天気状態、気温、湿度）を作成する
  - WeatherServiceインターフェースを定義し、都市名から天気データを取得する機能を持たせる
  - 複数都市（東京、大阪、ニューヨーク等）のモック天気データを静的に定義する
  - 都市名の大文字・小文字を区別しない検索に対応する
  - 存在しない都市の場合はnullを返却する
  - TDDでWeatherServiceのユニットテストを先に書き、正常系と都市不明系をカバーする
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 2.2 天気予報APIエンドポイントとエラーハンドリング実装
  - `/weather`エンドポイント（GETリクエスト）を作成し、クエリパラメータ`city`を受け付ける
  - `city`パラメータ未指定の場合に400エラーを統一フォーマットで返却する
  - WeatherServiceで都市が見つからない場合に404エラーを統一フォーマットで返却する
  - WeatherServiceでエラーが発生した場合に503エラーを統一フォーマットで返却する
  - エラーレスポンスは`{ statusCode, message }`の一貫した構造を使用する
  - `/`ヘルスチェックエンドポイントでサービス稼働状態を返却する
  - TDDで各ステータスコード（200, 400, 404, 503）のテストを先に書く
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.4, 6.3_

- [ ] 3. x402server 決済ミドルウェア統合
  - `@x402/hono`の`paymentMiddleware`を`/weather`エンドポイントに適用する
  - 環境変数からウォレットアドレスとファシリテーターURLを読み取り、ミドルウェアに渡す
  - ルート設定でBase SepoliaテストネットとUSD建て価格を指定する
  - `.dev.vars`に開発用の環境変数値を設定する
  - 決済なしのリクエストが402を返却すること、決済ミドルウェアがヘルスチェック（`/`）を保護しないことを確認するテストを書く
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.5_

- [ ] 4. (P) mcpserver プロジェクト基盤セットアップ
  - MCP関連パッケージ（`@modelcontextprotocol/sdk`, `@hono/mcp`, `zod`）とx402クライアントパッケージ（`@x402/fetch`, `@x402/core`, `@x402/evm`）をmcpserverに追加する
  - Vitestをdevdependencyに追加し、テスト設定ファイルを作成する
  - TypeScript設定でstrict modeを有効化する
  - 環境変数テンプレート（`.dev.vars.example`）を作成し、`CLIENT_PRIVATE_KEY`と`X402_SERVER_URL`の定義場所を明示する
  - `wrangler.jsonc`にnodejs_compat互換フラグを追加する（必要に応じて）
  - _Requirements: 5.2, 5.4, 5.5_

- [ ] 5. mcpserver MCPサーバー基盤実装
  - `@modelcontextprotocol/sdk`の`McpServer`インスタンスを作成し、サーバー名とバージョンを設定する
  - `@hono/mcp`の`StreamableHTTPTransport`を使用して`/mcp`エンドポイントを構築する
  - MCPサーバーの接続ライフサイクル（connect/disconnect）を管理する
  - `/`ヘルスチェックエンドポイントでサービス稼働状態を返却する
  - CORSミドルウェアを設定し、ChatGPTからのアクセスを許可する
  - `/mcp`エンドポイントがMCP JSON-RPCリクエストを受け付けることを確認するテストを書く
  - _Requirements: 3.1, 6.4_

- [ ] 6. mcpserver get_weatherツールとx402クライアント実装
- [ ] 6.1 X402FetchClient実装
  - `@x402/fetch`を使用してx402決済付きfetchクライアントを構築する
  - 環境変数から`CLIENT_PRIVATE_KEY`と`X402_SERVER_URL`を読み取る
  - `viem`の`privateKeyToAccount`でクライアントウォレットを初期化する
  - x402serverの`/weather`エンドポイントに都市名を指定してリクエストを送信する機能を実装する
  - x402server接続失敗時にわかりやすいエラーメッセージを生成する
  - 決済処理中のエラーをキャッチし、詳細なエラー情報を含む例外を生成する
  - fetchのモックを使ったユニットテストで正常系・エラー系をカバーする
  - _Requirements: 3.3, 3.4, 4.2, 4.3_

- [ ] 6.2 get_weatherツール定義とMCPレスポンス構築
  - McpServerに`get_weather`ツールを登録し、ツール名・説明文・入力スキーマ（zodで`city`パラメータ）を定義する
  - ツールハンドラーでX402FetchClientを呼び出し、天気データを取得する
  - 取得した天気データをMCPレスポンス形式（content配列にテキストで天気情報を整形）で返却する
  - X402FetchClientのエラーをキャッチし、`isError: true`のMCPエラーレスポンスに変換する
  - ツール定義のスキーマが正しいこと、正常系・エラー系のレスポンス形式が正しいことをテストする
  - _Requirements: 3.2, 3.3, 3.5, 4.2, 4.3_

- [ ] 7. 結合テストと動作検証
  - x402serverとmcpserverの両方をローカルで起動し、エンドツーエンドの通信を確認する
  - mcpserverのget_weatherツールからx402serverの天気APIにリクエストが正しく送信されることを確認する
  - x402決済フローが正しく動作し、決済後に天気データが返却されることを確認する
  - 各サーバーのヘルスチェックエンドポイントが正常に応答することを確認する
  - 不正な都市名やパラメータなしの場合のエラーハンドリングが正しく伝搬することを確認する
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.3, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4_
