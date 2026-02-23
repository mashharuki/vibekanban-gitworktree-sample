# Code Style and Conventions

## General
- AGENTS.md の共通ガイドラインを最優先
- 思考は英語、ユーザー向け応答と Markdown ドキュメントは日本語
- 仕様駆動開発（Requirements -> Design -> Tasks -> Implementation）を基本フローとする

## Naming
- Files / directories: kebab-case
- Classes / Types: PascalCase
- Functions / variables: camelCase
- Constants: UPPER_SNAKE_CASE

## TypeScript
- strict mode 前提
- `any` は原則禁止
- 型安全性を優先し、エラー抑制ではなく根本原因を修正

## Testing
- TDD 指向（t-wada の原則準拠）
- 振る舞い中心のテスト
- テストの独立性・再現性・速度を重視
- エラーケースも必ずテスト対象に含める

## Git
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`)
- コミットメッセージは英語
- 原子的コミット
- main/master へ直接コミットしない

## Security / Reliability Baseline
- 秘密情報は環境変数管理（ハードコード禁止）
- 外部入力バリデーションを必須化
- タイムアウト・リトライ・観測可能性（ログ/メトリクス）を考慮
