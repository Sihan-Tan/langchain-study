# LangChain Study

This repository contains the original TypeScript learning examples and the **markdown-messages** Vue + TypeScript LangChain UI pattern. Dependencies are managed from the root `package.json`; the LangGraph agent lives in `agents/simple.ts`, and the Vite application lives in `frontend/`.

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- DeepSeek API access for the learning examples and agent

## Setup

1. Create the root environment file without overwriting an existing one, then fill in your DeepSeek settings:

```powershell
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}
```

2. Install all dependencies:

```powershell
pnpm install
```

## Run markdown-messages

```powershell
pnpm dev
```

This starts both the LangGraph agent server (port 2024) and the Vite frontend (port 4100). To start them separately, use `pnpm dev:agent` and `pnpm dev:frontend`.

The Vite dev server proxies `/api/langgraph` to `http://127.0.0.1:2024`. Open [http://localhost:4100](http://localhost:4100) in your browser.

Type-check, build, and preview the frontend with:

```powershell
pnpm typecheck
pnpm build
pnpm preview
```

## Original learning examples

```powershell
pnpm start
pnpm test:model
pnpm test:tool
pnpm test:memory
pnpm test:sse
```

The `test:*` commands call real models and require their corresponding environment variables and API access.
