# AGENTS.md — EasyQueue (Monorepo Root)

Este arquivo descreve o projeto como um todo.
Para detalhes operacionais de cada pacote/aplicativo, veja o `AGENTS.md` dentro de cada subdiretório.

---

## O que é

EasyQueue é um aplicativo desktop para inspecionar, publicar e debugar mensagens de fila (SQS, RabbitMQ) — como um Postman, mas para message brokers.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS + shadcnUI + Lucide React |
| Estado | Zustand v5 |
| Desktop | Electron (via Vite plugin) |
| Monorepo | pnpm workspaces (lockfile v9) |
| Testes | Vitest (cada app/package) |
| Testes e2e | Playwright (`apps/desktop`) |
| CI | GitHub Actions (matrix: vitest + playwright) |

---

## Monorepo Structure

```text
apps/
  desktop/          ← Electron + React + Vite (aplicação desktop)

packages/
  core/             ← Contratos comuns (QueueClient, QueueMessage, Connection)
  provider-sqs/     ← Provider AWS SQS
  provider-rabbitmq/ ← Provider RabbitMQ
  provider-redisstreams/ ← Provider Redis Streams
  shared/           ← Utilitários compartilhados
```

Dependências:

```text
core
  ↑

providers
  ↑

desktop
```

Regras:
- `core` nunca depende de providers
- Providers dependem de `core`
- `desktop` depende de tudo
- `shared` não depende de providers

---

## Core

Contém apenas contratos comuns:

- `QueueClient` — interface principal (connect, disconnect, listQueues, publish, startListening, stopListening)
- `QueueMessage` — modelo normalizado de mensagem
- `Connection` — informação de conexão por provider

Nada de registries, managers ou factories.

---

## Providers

Cada provider é isolado e implementa `QueueClient`.

Responsabilidades:
- autenticação (mecanismo natural de cada plataforma)
- conexão
- publicação
- escuta (mecanismo nativo: SQS long polling, RabbitMQ channel.consumes)
- mapeamento de objetos do SDK para `QueueMessage`

Provider SDK objects nunca vazam pra UI. Quando necessário, armazenar em `raw`.

---

## Desktop

Ver `apps/desktop/AGENTS.md` para detalhes completos.

Pontos principais:
- Single-page app (sem React Router)
- Layout em painéis redimensionáveis (`react-resizable-panels`)
- Comunicação com backend via `queueApi` bridge (Electron preload ou mock e2e)
- Tema dark/light com classe `dark` no `<html>`
- Conexões persistidas em memória (mock) ou via backend
- Testes e2e com Playwright + mock injetado via `addInitScript`

---

## Testes

```bash
# Testes de todos os providers (e2e)
pnpm test -r

# Testes e2e do desktop (Playwright)
pnpm test:e2e
```

---

## Filosofia

- Simplicidade > arquitetura
- Evitar DDD, CQRS, Clean Architecture, camadas de serviço, factories genéricas
- Abstrações só quando houver um caso de uso real
- Preferir interfaces, composição, classes pequenas, nomes explícitos, arquivos pequenos
- Evitar herança, classes utilitárias gigantes, helpers genéricos, otimização prematura
- Preferir dependências leves — antes de adicionar uma lib, pensar se dá pra fazer com stdlib

---

## Roadmap

### Feito
- [x] SQS provider (connect, list, publish, consume)
- [x] RabbitMQ provider (connect, list, publish, consume)
- [x] Azure Service Bus provider (connect, list, publish, consume)
- [x] Redis Streams provider (connect, list, publish, consume)
- [x] Normalização de mensagens via `QueueMessage`
- [x] Tema dark/light
- [x] Visualizador JSON
- [x] Busca e filtro de mensagens
- [x] Painel de detalhe da mensagem
- [x] Replay / Delete de mensagens
- [x] Testes e2e (Playwright) + CI

### Próximos
- [ ] Message re-drive (re-publicar em fila diferente)
- [ ] Conexões persistidas (salvar config)
- [ ] Message diff
- [ ] Message replay histórico
- [ ] Plugin system para providers de terceiros
