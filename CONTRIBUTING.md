# Contributing to EasyQueue

First off, thanks for taking the time to contribute! 🎉

EasyQueue is an open-source desktop app for inspecting, publishing, and debugging queue messages. This document outlines the workflow, code conventions, and guidelines for contributing.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Provider Contributions](#provider-contributions)
- [Documentation](#documentation)
- [Questions?](#questions)

---

## Code of Conduct

This project follows a simple principle: **be respectful and constructive**. Harassment, toxic behavior, or gatekeeping will not be tolerated. We're all here to learn and build something useful.

---

## Getting Started

1. **Fork the repository** and clone your fork.
2. Read the `AGENTS.md` files in the root and in `apps/desktop/` — they contain the full context of the project.
3. Check the [open issues](https://github.com/sousadiego11/easyqueue/issues) for something to work on.
4. If you're planning a new feature, open an issue first to discuss it.

### Prerequisites

- **Node.js** >= 20 (check `.nvmrc` for the exact version)
- **pnpm** >= 9 (the monorepo uses pnpm workspaces)
- **Git** — basic knowledge required

---

## Project Structure

```
├── apps/
│   ├── desktop/          ← Electron + React + Vite (the main app)
│   └── docs/             ← Landing page site (Vite + React)
├── packages/
│   ├── core/             ← Contracts: QueueClient, QueueMessage, Connection
│   ├── provider-sqs/     ← AWS SQS provider implementation
│   ├── provider-rabbitmq/← RabbitMQ provider implementation
│   ├── provider-redisstreams/ ← Redis Streams provider implementation
│   └── shared/           ← Shared utilities (IPC channels, types)
├── .github/workflows/    ← CI (unit tests, e2e, build artifacts)
├── AGENTS.md             ← AI agent instructions (root)
└── CONTRIBUTING.md       ← You are here
```

### Dependency flow

```
core (interfaces only)
  ↑
providers (implement QueueClient)
  ↑
desktop (depends on everything)
```

Rules:
- `core` never depends on providers
- Providers depend only on `core`
- `desktop` depends on everything
- `shared` depends on nothing

---

## Development Setup

```bash
# Install dependencies (from root)
pnpm install

# Start the desktop app in development mode
pnpm dev

# Run the landing page site
pnpm --filter @easyqueue/docs dev

# Type-check everything
pnpm typecheck
```

No build step required before running — Vite handles everything.

---

## Architecture Overview

### Core (`packages/core`)

Pure TypeScript types and interfaces — no runtime code:

- `QueueClient` — the main interface every provider implements (connect, disconnect, listQueues, publish, startListening, stopListening)
- `QueueMessage` — normalized message model
- `Connection` — connection configuration per provider
- `QueueError` + `QueueErrorCode` — standardized error handling

### Providers (`packages/provider-*`)

Each provider is an isolated package implementing `QueueClient`:

| Provider | SDK | Key features |
|---|---|---|
| AWS SQS | `@aws-sdk/client-sqs` | Long polling, batch receive, ChangeMessageVisibility |
| RabbitMQ | `amqplib` + Management HTTP API | Channel management, auto-reconnect, ack/nack |
| Azure SB | — | Planned |
| Google Pub/Sub | — | Planned |

Provider responsibilities:
- Authentication (each platform's native mechanism)
- Connection lifecycle
- Message publishing and consuming
- Mapping SDK objects to `QueueMessage`
- Never leaking SDK objects to the UI layer (store them in `raw` if needed)

### Desktop (`apps/desktop`)

The Electron + React single-page application. Key patterns:

- **State management**: Zustand v5 stores (`useAppStore`, `useConnectionStore`, `useMessageStore`)
- **API bridge**: `window.queueApi` exposed via Electron preload (or mocked in e2e tests)
- **UI**: Tailwind CSS + shadcnUI + Lucide React
- **Layout**: `react-resizable-panels` (sidebar 240px, detail panel, publisher)
- **Theme**: Dark/light via `dark` class on `<html>`, persisted in localStorage
- **Routing**: None — single-page with panel-based layout

---

## Coding Guidelines

### Stack — no negotiation

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| UI components | shadcnUI (or Radix primitives) |
| Icons | Lucide React exclusively |
| State | Zustand v5 |
| Toasts | Sonner |
| JSON editor | vanilla-jsoneditor |
| Unit tests | Vitest |
| E2e tests | Playwright |

### Philosophy

- **Simplicity over architecture.** No DDD, CQRS, Clean Architecture, service layers, or generic factories. Abstract only when there's a real use case.
- **Small files, explicit names.** Prefer many small files with clear names over large utils or helpers.
- **Light dependencies.** Before adding a library, ask: can this be done with the standard library?
- **Composition over inheritance.** Use interfaces, small classes, and composition.

### TypeScript

- **No `any`** — ever. `// @ts-ignore` and `// @ts-expect-error` are also forbidden.
- Domain types come from `@easyqueue/core` or the API bridge — never define them inside components.
- Use explicit types for function signatures; inference is fine for locals.

### React & Components

- Components in `src/components/ui/` — generic, no business logic (shadcnUI)
- Components in `src/features/` — business logic, store access
- **No inline styles** (`style={{}}`) — use Tailwind classes
- **No inline SVGs** — use Lucide React icons. The only exception is the logo in `Sidebar.tsx`.

### Styling (Tailwind)

- Use utility classes directly in JSX: `className="flex items-center gap-2 p-3"`
- Prefer theme tokens: `bg-background`, `text-foreground`, `text-muted-foreground`
- Status colors (red/green) are the only hardcoded exception: `bg-[#22c55e]`, `bg-[#f87171]`
- For the docs site, use the custom tokens defined in `src/index.css`: `bg-surface`, `text-text-secondary`, `border-primary/30`, etc.
- **Never use `!important`** in CSS.

### shadcnUI

- All shadcnUI components live in `components/ui/`
- Add new ones via `npx shadcn@latest add [component]`
- **Never edit** these files manually except for minimal cosmetic tweaks
- Prefer using shadcnUI primitives (Button, Badge, Dialog, Tabs) over building your own

### State Management (Zustand)

All shared state lives in stores:

- `useAppStore` — theme, active queue, selected message, modal states
- `useConnectionStore` — connections CRUD, connection status
- `useMessageStore` — messages, loading/error states, message operations

**Never** use `useState` for: theme, active queue, selected message, modal state, current connection.

### Naming conventions

| What | Convention |
|---|---|
| React components | `PascalCase` |
| Component files | `PascalCase.tsx` |
| shadcnUI files | `kebab-case.tsx` |
| Utils, stores, mocks | `camelCase.ts` |
| Functions, variables | `camelCase` |

### Accessibility — minimum, not optional

- Every `<img>` has `alt`
- Action buttons have `aria-label`
- Theme toggle has dynamic `aria-label`: "Switch to dark mode" / "Switch to light mode"
- Clickable table rows: `role="button"`, `tabIndex={0}`, respond to `Enter` and `Space`
- Detail panel renders in `<aside>`

---

## Testing

### Unit tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm --filter @easyqueue/desktop test:watch
```

Test files live in `src/__tests__/`. Use `vi.mock` to isolate stores.

### E2e tests (Playwright)

```bash
# Headless (CI)
pnpm test:e2e

# With visible window
pnpm test:e2e:headed
```

The e2e suite uses `e2e/fixtures/apiMock.js` injected via `page.addInitScript`. This mock replaces `window.queueApi` with an in-memory implementation, so no actual AWS or RabbitMQ credentials are needed.

### CI

GitHub Actions runs two parallel jobs on push/PR to `main`:

- **unit**: `vitest` on the desktop app
- **e2e**: Playwright with Chromium

Both run on Ubuntu with cached pnpm dependencies.

---

## Pull Request Process

1. **Create a branch** from `main` with a descriptive name (`feat/azure-provider`, `fix/message-delete-bug`).
2. **Make your changes** following the coding guidelines above.
3. **Run the checklist** before opening the PR:

   - [ ] No `style={{}}` inline anywhere
   - [ ] No inline SVGs (except the logo in Sidebar)
   - [ ] No icons outside `lucide-react`
   - [ ] No domain types outside `types.ts` or `api/queueApi.ts`
   - [ ] No global state in local `useState`
   - [ ] Components in `ui/` don't access the store
   - [ ] Folder structure matches the map
   - [ ] Naming follows conventions
   - [ ] Accessibility minimum present
   - [ ] Unit tests pass (`pnpm test`)
   - [ ] E2e tests pass (`pnpm test:e2e`)

4. **Open the PR** against `main`. Keep it focused — one feature or fix per PR.
5. **Wait for CI** to pass. If it fails, fix the issues.
6. **Request review** from a maintainer.

### PR title format

```
type: short description
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.

Example: `feat: add Azure Service Bus provider`

---

## Provider Contributions

Adding a new provider is one of the most valuable contributions you can make. Here's the process:

1. **Create a new package** under `packages/provider-<name>/`
2. Import `QueueClient` from `@easyqueue/core`
3. Implement all the methods of the interface
4. Map SDK types to `QueueMessage` — never let SDK objects leak out
5. Add the provider to the desktop app's connection modal
6. Update `pnpm-workspace.yaml` if needed
7. Add tests (unit + e2e mock if applicable)

See `packages/provider-sqs/`, `packages/provider-rabbitmq/`, and `packages/provider-redisstreams/` as reference implementations.

---

## Documentation

- `AGENTS.md` files contain the full project context for AI agents and new contributors
- Update them when you add significant features, change the stack, or modify the folder structure
- The landing page (`apps/docs/`) is a separate React app — update it if you add new features that should be highlighted

---

## Questions?

Open a [discussion](https://github.com/sousadiego11/easyqueue/discussions) or an [issue](https://github.com/sousadiego11/easyqueue/issues) with your question.

For bugs, include:
- OS and version
- Broker type (SQS, RabbitMQ, etc.)
- Steps to reproduce
- Expected vs actual behavior

---

*EasyQueue is distributed under the MIT License. By contributing, you agree that your contributions will be licensed under the same license.*
