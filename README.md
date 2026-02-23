# vibekanban-gitworktree-sample

VibeKanbanとGitWorktreeを掛け合わせたサンプルアプリ

## 概要

x402バックエンドサーバーとMCPサーバーを使ってGPT App内のチャットインターフェースから天気予報の情報を取得すると同時にステーブルコイン支払いが行われるサンプルアプリ。

## 技術スタック

- 全体の構成
  - monorepo
  - pnpm
- x402バックエンドサーバー
  - hono
  - x402ライブラリ
  - vitest
  - cloudflare workers
  - TypeScript
- MCPサーバー
  - hono
  - GPT App SDK
  - vitest
  - cloudflare workers
  - TypeScript

## VibeKanbanの始め方

```bash
npx vibe-kanban
```

## Git Worktreeの始め方

```bash
# 新しいworktreeを作成（新規ブランチも同時作成）
git worktree add ../project-task-a -b feature/task-a

# 既存ブランチでworktreeを作成
git worktree add ../project-task-b feature/task-b

# worktree一覧を確認
git worktree list

# 作業完了後、worktreeを削除
git worktree remove ../project-task-a

# 強制削除（未コミットの変更がある場合）
git worktree remove --force ../project-task-a
```

## Cloudflare Workersへのデプロイ・クリーンアップコマンド

### x402バックエンドサーバー

- ローカルでの検証

  ```bash
  pnpm x402server run dev
  ```

- デプロイ

  ```bash
  pnpm x402server run deploy
  ```

- クリーンアップ

  ```bash
  pnpm x402server run delete
  ```

### MCPサーバー

- ローカルでの検証

  ```bash
  pnpm mcpserver run dev
  ```

- デプロイ

  ```bash
  pnpm mcpserver run deploy
  ```

- クリーンアップ

  ```bash
  pnpm mcpserver run delete
  ```

## cc-sdd + VibeKanban + GitWorkTreeによる開発のワークフロー

- 0. プロダクトのビジョン、コンセプトを策定する
- 1. cc-sddで要件定義と設計書、タスクリストを作成する
- 2. VibeKanbanにタスクを登録
- 3. git worktreeで作業ディレクトリを準備
- 4. タスクの並列実行
- 5. 各成果物をセルフレビュー・PR作成

## GPT Appへの登録方法&操作方法

- 1. x402バックエンドサーバーとmcpサーバーをCloudFlare Workersにデプロイする
- 2. MCPサーバーのエンドポイントをGPT Appに登録する(検証目的なら認証はなしでOK)
- 3. +ボタンから追加したアプリを選んで追加した状態で天気予報を教えてもらう
- 4. 天気予報が返ってきてUSDCが支払いされていればOK!
- 5. 検証が終わったら必ずサーバーを落とし、MCPサーバーの接続も解除する。

## 参考文献

- [【2026年最新】Claude Code作者が実践する「超並列駆動」開発術がエンジニアの常識を破壊していた](https://qiita.com/ot12/items/66e7c07c459e3bb7082d)
- [世界一わかりやすくGit worktreeを解説！AI駆動開発でも活用できる並列開発の方法](https://zenn.dev/tmasuyama1114/articles/git_worktree_beginner)
- [Claude Code × VibeKanban × git worktreeで実現するタスク並列実行のすすめ](https://zenn.dev/coconala/articles/379aadf643ecb8)
- [公式サイト - Vibekanban](https://vibekanban.com/)
- [GitHub - Vibekanban](https://github.com/BloopAI/vibe-kanban)
