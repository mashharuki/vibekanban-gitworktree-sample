# Project Overview

## Purpose
GPT App内のチャットインターフェースから天気予報情報を取得し、x402プロトコルによるステーブルコイン自動決済を行うサンプルアプリ。

## Tech Stack
- **Language**: TypeScript (strict mode)
- **Framework**: Hono (both servers)
- **Runtime**: Cloudflare Workers
- **Testing**: Vitest
- **Package Manager**: pnpm (monorepo)
- **Key Libraries**: x402ライブラリ, GPT App SDK

## Architecture
pnpm monorepo with two Cloudflare Workers services:
1. x402 Backend Server - Weather API + payment gateway
2. MCP Server - GPT App integration via Model Context Protocol

## Current State
Early stage - README and project configuration only, no source code yet.
