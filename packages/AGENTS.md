# AGENTS.md — Creating a new Provider

This document is the **definitive checklist** for creating a new provider in EasyQueue.
Read it in full before writing any code.

---

## Overview

Every provider implements the `QueueClient` interface from `@easyqueue/core`.
The architecture is intentionally simple — no abstraction layers, factories, or registries.

Layer dependencies:

```
core (interfaces + errors)
  ↑
provider-xxx (implements QueueClient)
  ↑
desktop (UI + ConnectionService)
```

---

## File structure for a new provider

```
packages/provider-xxx/
├── package.json
├── vitest.config.ts
└── src/
    ├── index.ts           ← QueueClient implementation
    └── __tests__/
        └── index.test.ts  ← Required tests (28-30 tests)
```

---

## Step-by-step checklist

### 1. Core: define config types

File: `packages/core/src/interfaces/Connection.ts`

```ts
// 1. Create config interface
export interface XxxConfig extends Record<string, unknown> {
  url: string
  // provider-specific properties
}

// 2. Add to ProviderConfigs union
export interface ProviderConfigs {
  sqs: SQSConfig
  rabbitmq: RabbitMQConfig
  redis: RedisConfig
  xxx: XxxConfig          // ← NEW
}

// 3. Provider type is automatic (keyof ProviderConfigs)
```

File: `packages/core/src/index.ts` — export the new type in the barrel:

```ts
export type { Connection, Provider, ProviderConfigs, SQSConfig, RabbitMQConfig, RedisConfig, XxxConfig } from "./interfaces/Connection"
//                                                                                                  ^^^^^^^^ NEW
```

---

### 2. Provider implementation

File: `packages/provider-xxx/src/index.ts`

The class must implement `QueueClient` (defined in `packages/core/src/interfaces/QueueClient.ts`):

```ts
interface QueueClient {
  id: string
  name: string
  provider: Provider
  connected: boolean
  config: Record<string, unknown>
  connect(): Promise<void>
  disconnect(): Promise<void>
  listQueues(): Promise<QueueInfo[]>
  listMessages(queue: string, limit?: number): Promise<QueueMessage[]>
  publish(request: PublishRequest): Promise<void>
  deleteMessage(queue: string, messageId: string): Promise<void>
  releaseMessage(queue: string, messageId: string): Promise<void>
  releaseQueue(queue: string): Promise<void>
  purgeQueue(queue: string): Promise<void>
}
```

**Implementation rules:**

| Method | Rules |
|---|---|
| `constructor` | Validate config with `QueueError(INVALID_CONFIGURATION)`; generate `this.id` via `crypto.randomUUID()`; set `this.provider = "xxx"` |
| `connect()` | Must perform a **real network call** to verify connectivity (not just instantiate SDK client). SDK errors must be **wrapped** in `QueueError(CONNECTION_FAILED)` via try/catch |
| `disconnect()` | Must be safe to call when already disconnected |
| `listQueues()` | Guard with `PROVIDER_NOT_CONNECTED` |
| `listMessages()` | Use `fetchedMessages` Map to track fetched msgs |
| `publish()` | Specific errors may use `QueueError(PUBLISH_FAILED)` |
| `deleteMessage()` | If `messageId` not in `fetchedMessages`, no-op (no error) |
| `releaseMessage()` | If `messageId` not in `fetchedMessages`, no-op (no error) |
| `releaseQueue()` | Iterate `fetchedMessages` filtering by queue |
| `purgeQueue()` | Iterate `fetchedMessages` filtering by queue |
| `toQueueMessage()` private | Map native SDK object → `QueueMessage` |

**FetchedMessages pattern (critical):**

```ts
private fetchedMessages = new Map<string, RawMessageType>()

// In listMessages:
const msg = await this.channel.get(queue)
if (msg) {
  const qm = this.toQueueMessage(queue, msg)
  this.fetchedMessages.set(qm.id, msg)   // stores raw SDK object, NOT QueueMessage
  messages.push(qm)
}

// In deleteMessage/releaseMessage:
const raw = this.fetchedMessages.get(messageId)
if (!raw) return    // ← no-op for unknown ID
// use raw for SDK-specific ack/nack/delete
this.fetchedMessages.delete(messageId)
```

**QueueMessage type:**

```ts
interface QueueMessage {
  id: string
  queue: string
  payload: unknown
  timestamp: Date
  headers?: Record<string, string>
  raw?: unknown  // original SDK object (does not leak to UI)
}
```

**Error wrapping rule:**
- `connect()`: ALWAYS wrap SDK errors in `QueueError(CONNECTION_FAILED)` via try/catch
- All other methods: DO NOT wrap (the raw SDK error propagates as-is)

---

## Behavioral contract (QueueClient semantics)

Além de implementar os métodos da interface, todo provider precisa satisfazer as
**garantias semânticas** abaixo. Elas valem para todos os brokers; a implementação
interna pode variar (ack/nack, visibility timeout, XACK/XCLAIM, etc.), mas o
comportamento observado pela UI deve ser idêntico.

### 1. `listMessages(queue, limit)`

| Garantia | Detalhes |
|---|---|
| Retorna até `limit` mensagens | Se a fila tiver menos que `limit`, retorna todas sem lançar erro (array vazio se não houver nenhuma) |
| Mensagens entram em `fetchedMessages` | Cada mensagem retornada é armazenada no mapa _com o nome da fila_ para permitir filtragem posterior |
| Mensagens ficam "em consumo" | Nenhuma confirmação (ack) é enviada durante a listagem — elas ficam pendentes até `deleteMessage`/`purgeQueue` (confirmar) ou `releaseMessage`/`releaseQueue` (devolver) |
| Limpeza de `fetchedMessages` | Antes de buscar novas mensagens, `listMessages` **deve** limpar todo o `fetchedMessages` (nack/requeue/clear). O design é **single-queue-at-a-time**: a UI sempre chama `clearMessages()` ao trocar de fila, e o provider nunca precisa lidar com mensagens de múltiplas filas simultaneamente |

### 2. `purgeQueue` / `deleteMessage`

| Garantia | Detalhes |
|---|---|
| Confirma apenas mensagens consumidas | A operação **nunca** deve chamar a API de purge do broker (ex: `PurgeQueue` no SQS, `channel.queuePurge` no RabbitMQ). Deve confirmar individualmente cada mensagem presente em `fetchedMessages` para aquela fila |
| Mensagens não consumidas são intocadas | Mensagens que estão na fila mas nunca passaram por `listMessages` deste client **não** devem ser afetadas |

### 3. `releaseQueue` / `releaseMessage`

| Garantia | Detalhes |
|---|---|
| Devolve à fila | A mensagem deve voltar a ficar disponível no broker (nack com requeue, visibility timeout = 0, XCLAIM + XADD, etc.) |
| Visível em nova listagem | A mensagem devolvida deve aparecer em chamadas futuras de `listMessages` para a mesma fila |
| Teste de integração obrigatório | Esse comportamento **precisa** ser coberto por teste de integração (real contra o broker ou Docker), não apenas unitário com mock |

### 4. Republish / replay individual

| Garantia | Detalhes |
|---|---|
| Payload e headers idênticos | A mensagem republicada deve ser uma cópia exata da original — mesmo payload (comparação profunda) e mesmos headers |
| Validação com deep equal | O teste deve comparar `original.payload` com `republicado.payload` usando `toEqual()` ou `deepEqual`, não apenas verificar que `publish()` foi chamado |
| Cadeia completa | O teste deve: (1) publicar → (2) listar → (3) republicar com os dados da listagem → (4) listar de novo → (5) comparar a mensagem republicada com a original |

### 5. Origem agnóstica das mensagens

| Garantia | Detalhes |
|---|---|
| Funciona com qualquer produtor | `listMessages` deve retornar mensagens publicadas **por qualquer produtor** no broker, não apenas as publicadas via `publish()` do EasyQueue |
| Sem dependência de metadado próprio | Nenhuma implementação pode depender de header/campo que só existe em mensagens publicadas pelo próprio client. Ex: se um produtor externo publica sem `headers` ou sem `publishedAt`, a mensagem ainda deve ser retornada (com `headers: undefined` e `timestamp` inferido) |
| Tolerância a campos ausentes | `toQueueMessage` deve tratar `undefined` / `null` em campos opcionais sem lançar erro |

### 6. Consistência entre providers

| Garantia | Detalhes |
|---|---|
| Mesmo contrato, mecanismo nativo | Cada provider usa o mecanismo nativo do seu broker (ack/nack no RabbitMQ, visibility timeout no SQS, XACK+XDEl no Redis Streams, complete/abandon no Azure SB, ack/modifyAckDeadline no Google Pub/Sub) |
| A UI não distingue providers | A camada de UI (`ConnectionService`, stores, componentes) não pode precisar saber qual provider está em uso para tomar decisões de fluxo — o contrato semântico deve ser suficiente |

---

### Violações encontradas na auditoria de `provider-sqs`, `provider-rabbitmq` e `provider-redisstreams`

As violações abaixo foram identificadas após aplicar as correções da task anterior.
Elas **não** foram corrigidas neste documento — devem virar tarefas separadas.

| Provider | Onde | Violação |
|---|---|---|
_Nenhuma violação do item 2 (`purgeQueue`/`deleteMessage`) — todos os providers limpam `fetchedMessages` antes de cada `listMessages`, então nunca há mensagens de múltiplas filas no mapa. O design assume **single-queue-at-a-time**: a UI chama `clearMessages()` ao trocar de fila, e o provider zera o mapa a cada `listMessages`. Filtragem por fila em `releaseQueue`/`purgeQueue` é desnecessária nesse modelo._
| RabbitMQ | `channel.on("error")` (linha 43-48) | Em caso de erro no canal, faz `this.fetchedMessages.clear()` sem nack — mensagens ficam órfãs no broker até timeout |
| Redis | `consumerGroup` fixo `"easyqueue"` (linha 15) | Duas instâncias do EasyQueue no mesmo Redis compartilham o mesmo consumer group, podendo uma instância ack mensagens da outra |
| Redis | `toQueueMessage` (linha 208-221) | Assume que os campos da stream entry são exatamente os mesmos que o EasyQueue publica (`payload`, `headers`, `publishedAt`). Mensagens de produtores externos com outros campos podem ter o payload ignorado/perdido |

---

### 3. `package.json`

See `packages/provider-redisstreams/package.json` as the exact template:

```json
{
  "name": "@easyqueue/provider-xxx",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf .tsbuildinfo"
  },
  "dependencies": {
    "@easyqueue/core": "workspace:*",
    "provider-sdk": "^x.y.z"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "vitest": "^4.1.9"
  }
}
```

---

### 4. `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
```

---

### 5. Root: `package.json`

Add to the `test` script:

```jsonc
// "test": "pnpm --filter @easyqueue/desktop test && pnpm --filter @easyqueue/provider-sqs test && pnpm --filter @easyqueue/provider-rabbitmq test && pnpm --filter @easyqueue/provider-redisstreams test && pnpm --filter @easyqueue/provider-xxx test"
//                                                                                                                                    ^^^^ NEW
```

---

### 6. Root: `tsconfig.base.json`

Add path alias:

```jsonc
"paths": {
  "@easyqueue/core": ["packages/core/src/index.ts"],
  // ...
  "@easyqueue/provider-xxx": ["packages/provider-xxx/src/index.ts"]  // ← NEW
}
```

---

### 7. Desktop: `vite.config.ts`

Add alias in resolve:

```ts
resolve: {
  alias: {
    // ...
    "@easyqueue/provider-xxx": path.resolve(packagesDir, "provider-xxx/src"),  // ← NEW
  },
},
```

---

### 8. Desktop: `apps/desktop/package.json`

Add dependency:

```json
"dependencies": {
  "@easyqueue/provider-xxx": "workspace:*",  // ← NEW
}
```

Then run `pnpm install`.

---

### 9. Desktop: `apps/desktop/electron/services/ConnectionService.ts`

Add import and switch case:

```ts
import { XxxClient } from "@easyqueue/provider-xxx"  // ← NEW

switch (provider) {
  // ...
  case "xxx":                                          // ← NEW
    client = new XxxClient(config as any, name)
    break
}
```

---

### 10. Provider icon

Create SVG at `apps/desktop/src/icons/XXX.svg`
(See `SQS.svg`, `RABBIT.svg`, `REDIS.svg` as reference.)

---

### 11. Desktop: `apps/desktop/src/features/sidebar/ConnectionList.tsx`

Add icon import and Record entry:

```tsx
import xxxIcon from "@/icons/XXX.svg"  // ← NEW

const providerIcon: Record<Provider, string> = {
  sqs: sqsIcon,
  rabbitmq: rabbitIcon,
  redis: redisIcon,
  xxx: xxxIcon,                        // ← NEW
}
```

---

### 12. Desktop: `apps/desktop/src/features/sidebar/NewConnectionModal.tsx`

Three places to update:

```tsx
// a) providerFields — form fields
const providerFields: Record<Provider, ProviderField[]> = {
  // ...
  xxx: [
    { key: "url", label: "URL", placeholder: "...", required: true },
    // additional fields...
  ],
}

// b) providerMeta — name/description/icon
const providerMeta: Record<Provider, { name: string; description: string; icon: string }> = {
  // ...
  xxx: { name: "Xxx", description: "...", icon: xxxIcon },
}

// c) availableProviders — list of selectable providers
const availableProviders: Provider[] = ["sqs", "rabbitmq", "redis", "xxx"]  // ← NEW
```

---

### 13. Docs site: `apps/docs/src/components/Brokers.tsx`

```tsx
import { CircleDot, Globe, Database, Layers, Server } from "lucide-react"

const supportedMap: Record<string, boolean> = {
  // ...
  "Xxx": false,  // ← NEW (false = "Planned", true = "Supported")
}
```

---

### 14. Docs site: i18n

`apps/docs/src/i18n/en.ts` and `apps/docs/src/i18n/pt-BR.ts`:

```ts
// Add to brokers.items array:
{
  name: "Xxx",
  desc: "Provider description...",
},
```

---

### 15. Root documentation

- `README.md` — add to provider list
- `CONTRIBUTING.md` — add if it lists providers
- `AGENTS.md` (root) — add to roadmap if applicable

---

## Required tests

Tests **must** follow the structure below exactly.
Use `packages/provider-sqs/src/__tests__/index.test.ts` as the primary reference (SQS = most stable pattern).

### Test file structure

All providers must have:

```
  describe("connect")
    ✓ should connect and set connected to true
    ✓ should throw CONNECTION_FAILED when <provider> fails   (assert QueueError com CONNECTION_FAILED)
    ✓ should throw CONNECTION_FAILED when <provider> is unreachable  (se aplicável, rede falha)
```

**Error assertions — golden rule (connect):**

```ts
// connect() → QueueError with code CONNECTION_FAILED
await expect(promise).rejects.toThrow(QueueError)
await expect(promise).rejects.toMatchObject({ code: QueueErrorCode.CONNECTION_FAILED })
```

### Complete structure

```
describe("XxxClient")
  describe("constructor")
    ✓ should throw if <field> is missing          (per required field)
    ✓ should throw if <field> is not valid         (URL/format validation)
    ✓ should start disconnected
  describe("connect")
    ✓ should connect and set connected to true
    ✓ should throw when <sdk> fails                (CONNECTION_FAILED wrapper)
  describe("disconnect")
    ✓ should set connected to false
    ✓ should be safe to call when not connected
  describe("listQueues")
    ✓ should throw PROVIDER_NOT_CONNECTED when not connected
    ✓ should return a list of queues
    ✓ should throw when <sdk> call fails           (RAW error, no QueueError)
  describe("listMessages")
    ✓ should throw PROVIDER_NOT_CONNECTED when not connected
    ✓ should return messages (array)
    ✓ should throw when <sdk> call fails           (RAW error)
  describe("publish")
    ✓ should throw PROVIDER_NOT_CONNECTED when not connected
    ✓ should publish a message successfully
    ✓ should throw when <sdk> call fails           (RAW error or PUBLISH_FAILED)
  describe("deleteMessage")
    ✓ should throw PROVIDER_NOT_CONNECTED when not connected
    ✓ should be no-op for unknown messageId
    ✓ should delete a fetched message
    ✓ should throw when <sdk> call fails           (RAW error)
  describe("releaseMessage")
    ✓ should throw PROVIDER_NOT_CONNECTED when not connected
    ✓ should be no-op for unknown messageId
    ✓ should release a fetched message
    ✓ should throw when <sdk> call fails           (RAW error)
  describe("releaseQueue")
    ✓ should throw PROVIDER_NOT_CONNECTED when not connected
    ✓ should release all fetched messages in the queue
  describe("purgeQueue")
    ✓ should throw PROVIDER_NOT_CONNECTED when not connected
    ✓ should purge all fetched messages in the queue
```

Total: **~28 tests** (varies ±2 based on config field count).

### Test code patterns

**Mock setup (use `vi.hoisted` + `vi.mock`):**

```ts
// 1. Shared mocks (accessible in both factory and test body)
const mocks = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockSomeSpecific: vi.fn(),
}))

// 2. SDK mock
vi.mock("provider-sdk", () => ({
  SdkClient: vi.fn(() => ({ send: mocks.mockSend })),
}))
```

**IMPORTANT:** If a mock needs an internal `vi.fn()` (e.g. `mockCreateChannel`),
declare it INSIDE the factory and use `mockResolvedValue` — never share via `mocks`.

**beforeEach:**

```ts
beforeEach(() => {
  vi.clearAllMocks()
  // Specific resets if needed
  mocks.mockSend.mockReset()
  mocks.mockSend.mockResolvedValue(/* default value */)
})
```

**connect helpers:**

```ts
async function connect(client: XxxClient) {
  await client.connect()
}

function createConnected() {
  return new XxxClient(validConfig)
}
```

**Error assertions — golden rule:**

```ts
// a) Provider wraps error (connect) → QueueError with code
await expect(promise).rejects.toMatchObject({ code: QueueErrorCode.CONNECTION_FAILED })

// b) Provider does NOT wrap error (all other methods) → raw error
await expect(promise).rejects.toThrow("Error message from SDK")
```

**"No-op for unknown ID" test:**

```ts
it("should be no-op for unknown messageId", async () => {
  const client = createConnected()
  await connect(client)
  await expect(client.deleteMessage("q", "unknown-id")).resolves.not.toThrow()
})
```

**delete/release test with listMessages — WARNING about mockResolvedValueOnce:**

```ts
// CORRECT:
mocks.mockChannelGet.mockResolvedValueOnce({ /* message */ })
await client.listMessages("test-queue")
//                              ^ first call → message
//                              ^ second call → null (from beforeEach, loop breaks)
await expect(client.deleteMessage("test-queue", "1")).resolves.not.toThrow()

// WRONG (silent failure — first call returns null):
mocks.mockChannelGet.mockResolvedValue({ /* message */ })
mocks.mockChannelGet.mockResolvedValueOnce(null)  // ← THIS IS A BUG!
await client.listMessages("test-queue")  // empty list!
```

The rule: `mockResolvedValueOnce(msg)` first, then fall through to `mockResolvedValue(null)` from `beforeEach`.

---

## Verification commands

```bash
# Provider tests
pnpm --filter @easyqueue/provider-xxx test

# All providers + desktop tests
pnpm test

# Typecheck
pnpm --filter @easyqueue/provider-xxx typecheck

# E2E (only if provider is used in e2e tests)
pnpm --filter @easyqueue/desktop test:e2e

# Docs build (if i18n was updated)
pnpm --filter @easyqueue/docs build
```

---

## Files that need changes — summary

### Provider package (4 files)
| File | Action |
|---|---|
| `packages/provider-xxx/package.json` | Create |
| `packages/provider-xxx/vitest.config.ts` | Create |
| `packages/provider-xxx/src/index.ts` | Create (implementation) |
| `packages/provider-xxx/src/__tests__/index.test.ts` | Create (~28 tests) |

### Root (2 files)
| File | Action |
|---|---|
| `package.json` | Add to test script |
| `tsconfig.base.json` | Add path alias |

### Desktop (6 files)
| File | Action |
|---|---|
| `apps/desktop/package.json` | Add dep `workspace:*` |
| `apps/desktop/vite.config.ts` | Add resolve alias |
| `apps/desktop/src/icons/XXX.svg` | Create SVG icon |
| `apps/desktop/electron/services/ConnectionService.ts` | Add import + switch case |
| `apps/desktop/src/features/sidebar/ConnectionList.tsx` | Add icon to `providerIcon` record |
| `apps/desktop/src/features/sidebar/NewConnectionModal.tsx` | Add fields + meta + available |

### Core (2 files)
| File | Action |
|---|---|
| `packages/core/src/interfaces/Connection.ts` | Add config type + ProviderConfigs entry |
| `packages/core/src/index.ts` | Export new config type in barrel |

### Docs (3 files)
| File | Action |
|---|---|
| `apps/docs/src/components/Brokers.tsx` | Add `supportedMap` entry |
| `apps/docs/src/i18n/en.ts` | Add broker item |
| `apps/docs/src/i18n/pt-BR.ts` | Add broker item |

### Documentation (2-3 files)
| File | Action |
|---|---|
| `README.md` | Add to provider list |
| `CONTRIBUTING.md` | Add to list (if applicable) |
| `AGENTS.md` (root) | Add roadmap entry |

---

## Reference files (read these, not the whole project)

| To understand | File |
|---|---|
| QueueClient interface | `packages/core/src/interfaces/QueueClient.ts` |
| Core barrel exports | `packages/core/src/index.ts` |
| Config types + Provider union | `packages/core/src/interfaces/Connection.ts` |
| QueueMessage model | `packages/core/src/interfaces/QueueMessage.ts` |
| Simple implementation example | `packages/provider-redisstreams/src/index.ts` |
| Implementation with auth | `packages/provider-rabbitmq/src/index.ts` |
| Tests — SQS pattern (most stable) | `packages/provider-sqs/src/__tests__/index.test.ts` |
| Tests — RabbitMQ pattern (vi.hoisted) | `packages/provider-rabbitmq/src/__tests__/index.test.ts` |
| Tests — Redis pattern | `packages/provider-redisstreams/src/__tests__/index.test.ts` |
| Desktop registration | `apps/desktop/electron/services/ConnectionService.ts` |
| Connection modal | `apps/desktop/src/features/sidebar/NewConnectionModal.tsx` |
| Connection list | `apps/desktop/src/features/sidebar/ConnectionList.tsx` |
| vitest.config template | `packages/provider-redisstreams/vitest.config.ts` |
| package.json template | `packages/provider-redisstreams/package.json` |
| vite.config desktop aliases | `apps/desktop/vite.config.ts` |
| tsconfig path aliases | `tsconfig.base.json` |
| Docs Brokers component | `apps/docs/src/components/Brokers.tsx` |
| Docs i18n english | `apps/docs/src/i18n/en.ts` |
| Docs i18n portuguese | `apps/docs/src/i18n/pt-BR.ts` |
