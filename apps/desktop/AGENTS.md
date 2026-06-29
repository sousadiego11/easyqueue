# AGENTS.md — EasyQueue

Este arquivo é a fonte de verdade para qualquer agente de IA trabalhando neste repositório.
Leia tudo antes de escrever qualquer linha de código.

---

## O que é este projeto

**EasyQueue** é uma interface desktop de monitoramento e debugging de filas de mensagens (SQS, RabbitMQ).
Público-alvo: engenheiros backend e DevOps.
O produto precisa transmitir confiabilidade, densidade de informação e controle.

---

## Stack — sem negociação

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript (Vite) |
| Estilo | **Tailwind CSS** + **shadcnUI** |
| Ícones | **Lucide React** — e nada mais |
| Estado global | Zustand v5 |
| Toasts | Sonner |
| JSON editor | vanilla-jsoneditor (readOnly) |
| Painéis redimensionáveis | react-resizable-panels |
| Testes unitários | Vitest |
| Testes e2e | Playwright |

**Ícones:** use sempre o componente do `lucide-react`. Se o ícone não existir no Lucide, abra uma issue antes de criar SVG manual. A única exceção aceita é o logotipo do produto na `Sidebar.tsx`.

---

## Estrutura de pastas

A estrutura abaixo é obrigatória — não é sugestão. Todo arquivo novo segue este mapa.

```
src/
├── __tests__/
│   └── stores.test.ts
├── api/
│   └── queueApi.ts              ← bridge para o backend Electron / mock
├── styles/
│   └── index.css                ← @tailwind base/components/utilities + CSS custom properties
├── components/
│   └── ui/                      ← shadcnUI components (gerados via `npx shadcn add`)
│       ├── SplitPane.tsx        ← wrapper react-resizable-panels
│       ├── JsonEditor.tsx       ← wrapper vanilla-jsoneditor
│       ├── badge.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sonner.tsx
│       ├── table.tsx
│       └── tabs.tsx
├── features/
│   ├── detail/
│   │   ├── DetailPanel.tsx
│   │   ├── MessageActions.tsx   ← Replay / Delete
│   │   └── MessageMeta.tsx
│   ├── header/
│   │   └── Header.tsx           ← status bar (fila ativa, conexão, theme toggle)
│   ├── messages/
│   │   └── MessageTable.tsx     ← tabela com filtros, sorting
│   ├── publisher/
│   │   └── Publisher.tsx
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── ConnectionList.tsx
│   │   ├── ContentArea.tsx      ← toolbar (Consume/Purge) + MessageTable
│   │   ├── NewConnectionModal.tsx
│   │   └── QueueList.tsx
│   └── titlebar/
│       └── TitleBar.tsx         ← janela Electron (minimize/maximize/close)
├── icons/
│   ├── LOGO.svg
│   ├── AZURE.svg
│   ├── RABBIT.svg
│   ├── REDIS.svg
│   └── SQS.svg
├── lib/
│   └── utils.ts                 ← função cn()
├── stores/
│   ├── useAppStore.ts
│   ├── useConnectionStore.ts
│   └── useMessageStore.ts
├── App.tsx
├── main.tsx
├── types.ts
└── vite-env.d.ts
```

### Regras de organização

- `components/ui/` → componentes shadcnUI (genéricos, sem lógica de negócio)
- `features/` → componentes com lógica de negócio, acesso ao store
- Nenhum arquivo na raiz de `src/` além de `App.tsx`, `main.tsx`, `types.ts` e `vite-env.d.ts`
- Nenhum componente com nome genérico sem contexto (`Card.tsx`, `Item.tsx`, `Component.tsx`)

---

## API / Bridge

O app se comunica com o backend via `queueApi` (definido em `src/api/queueApi.ts`).
Em ambiente Electron, o preload script expõe `window.queueApi`. Em testes e2e, o mock `e2e/fixtures/apiMock.js` define `window.queueApi`.

```ts
interface QueueApi {
  connect(name, provider, config): Promise<ConnectionInfo>
  disconnect(connectionId): Promise<void>
  listConnections(): Promise<ConnectionInfo[]>
  listQueues(connectionId): Promise<QueueInfo[]>
  listMessages(connectionId, queue, limit?): Promise<QueueMessage[]>
  publish(connectionId, queue, payload, headers?): Promise<void>
  deleteMessage(connectionId, queue, messageId): Promise<void>
  purgeQueue(connectionId, queue): Promise<void>
  clientConnect(connectionId): Promise<ConnectionInfo>
  clientDisconnect(connectionId): Promise<ConnectionInfo>
  updateConnection(connectionId, name, provider, config): Promise<ConnectionInfo>
  minimize(): void
  maximize(): void
  close(): void
}
```

---

## Regras de estilo

### Tema dark/light

Usamos a estratégia `class` do Tailwind. O toggle de tema adiciona/remove a classe `dark` no `<html>`:

```ts
toggleTheme: () => {
  const next = get().theme === 'light' ? 'dark' : 'light'
  document.documentElement.classList.toggle('dark', next === 'dark')
  localStorage.setItem('theme', next)
  set({ theme: next })
}
```

### Tailwind — como usar

- Use **utility classes** diretamente no JSX: `className="flex items-center gap-2 p-3"`
- Prefira as cores do tema: `bg-background`, `text-foreground`, `text-muted-foreground`, `border`
- Cores de status (verde/vermelho) excepcionalmente em hardcoded: `bg-[#22c55e]`, `bg-[#f87171]`
- Para variantes use Tailwind: `hover:bg-accent`, `dark:bg-gray-800`

### shadcnUI — como usar

- Todos os componentes shadcnUI ficam em `components/ui/`
- Use `npx shadcn@latest add [component]` para adicionar novos
- **Nunca edite** os componentes shadcnUI manualmente (a não ser para ajustes cosméticos mínimos)
- Prefira os componentes shadcnUI prontos (Button, Badge, Dialog, Tabs, etc.) a criar versões próprias

### O padrão esperado num componente de feature

```tsx
function MessageTable() {
  const messages = useMessageStore((s) => s.messages)
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      ...
    </div>
  )
}
```

---

## Estado global (Zustand)

Todos os estados compartilhados vivem em `stores/useAppStore.ts`, `stores/useConnectionStore.ts` e `stores/useMessageStore.ts`.

Interface do AppStore:

```ts
interface AppStore {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  activeQueue: string
  setActiveQueue: (q: string) => void
  selectedMessageId: string | null
  setSelectedMessageId: (id: string | null) => void
  activeTab: string
  setActiveTab: (t: string) => void
  isNewConnectionModalOpen: boolean
  openNewConnectionModal: () => void
  closeNewConnectionModal: () => void
  editingConnectionId: string | null
  openEditConnectionModal: (id: string) => void
  closeEditConnectionModal: () => void
  currentConnection: ConnectionInfo | null
  setCurrentConnection: (conn: ConnectionInfo | null) => void
}
```

Interface do ConnectionStore:

```ts
interface ConnectionStore {
  connections: ConnectionInfo[]
  isLoading: boolean
  error: string | null
  connect: (name, provider, config) => Promise<ConnectionInfo>
  disconnect: (id) => Promise<void>
  loadConnections: () => Promise<ConnectionInfo[]>
  updateConnection: (id, name, provider, config) => Promise<ConnectionInfo>
  toggleConnection: (id) => Promise<ConnectionInfo>
}
```

Interface do MessageStore:

```ts
interface MessageStore {
  messages: QueueMessage[]
  selectedMessage: QueueMessage | null
  isLoadingMessages: boolean
  error: string | null
  loadMessages: (connectionId, queue, limit?) => Promise<void>
  deleteMessage: (connectionId, queue, messageId) => Promise<void>
  purgeQueue: (connectionId, queue) => Promise<void>
  setSelectedMessage: (message) => void
  clearMessages: () => void
}
```

**Nunca** use `useState` para: tema, fila ativa, mensagem selecionada, estado do modal, conexão atual.

---

## Tipos globais (types.ts)

```ts
export type Theme = "light" | "dark"
```

Os tipos de domínio (`ConnectionInfo`, `QueueInfo`, `QueueMessage`, `Provider`) vêm dos pacotes `@easyqueue/core` ou de `src/api/queueApi.ts`.

---

## Layout

O layout é composto por painéis aninhados via `react-resizable-panels` (componente `SplitPane`):

```
┌──────────────┬──────────────────────────────────────────────┐
│  TitleBar    │  (minimize / maximize / close)               │
├──────────────┼───────────────────────────────┬──────────────┤
│  Sidebar     │  Header                       │              │
│  240px       │  (queue + status + theme)     │  Detail      │
│  ─────────── │  ContentArea                  │  Panel       │
│  Connections │  (Consume/Purge + MessageTbl) │  40%         │
│  Queues      │  ───────────────────────────  │  (oculto     │
│              │  Publisher                    │   se null)   │
└──────────────┴───────────────────────────────┴──────────────┘
```

- TitleBar: `h-9`, `app-drag-region` para janela Electron
- Sidebar: `240px` via SplitPane, `overflow-y-auto`
- DetailPanel: só renderiza quando `selectedMessage !== null`
- Publisher: `200px` altura via SplitPane vertical

---

## Acessibilidade mínima (não negociável)

- Todo `<img>` tem `alt`
- Botões de ação têm `aria-label`
- Toggle de tema tem `aria-label` dinâmico: `"Switch to dark mode"` / `"Switch to light mode"`
- Linhas clicáveis da tabela: `role="button"`, `tabIndex={0}`, responde a `Enter` e `Space`
- Painel de detalhe: renderizado em `<aside>`

---

## Nomenclatura

| O quê | Padrão |
|---|---|
| Componentes React | `PascalCase` |
| Arquivos de componente | `PascalCase.tsx` (shadcnUI em `kebab-case.tsx`) |
| Arquivos de utilitário, store, mock | `camelCase.ts` |
| Funções e variáveis | `camelCase` |
| Cores no Tailwind | `kebab-case` |

---

## Testes

### Unitários (Vitest)

```bash
pnpm test                    # apps/desktop
```

Arquivos em `src/__tests__/`. Usam `vi.mock` para isolar stores.

### E2E (Playwright)

```bash
pnpm test:e2e                # apps/desktop (headless)
pnpm test:e2e:headed         # com janela visível
```

Os testes usam `e2e/fixtures/apiMock.js` injetado via `page.addInitScript`.
O mock substitui `window.queueApi` e armazena dados em memória (`window.__connections`, `window.__messages`, etc.).

```text
e2e/
├── fixtures/
│   └── apiMock.js
├── specs/
│   ├── connections.spec.ts     ← criar/selecionar/toggle conexão
│   ├── detail-panel.spec.ts    ← abrir/fechar/replay/delete
│   ├── messages.spec.ts        ← consumir/purge/filtros
│   └── publisher.spec.ts       ← publicar/desabilitado
├── playwright.config.ts
```

---

## O que nunca fazer

- ❌ `style={{ }}` inline em qualquer lugar
- ❌ Cores, fontes ou espaçamentos hardcoded que deveriam usar tokens do tema (exceção: `bg-[#22c55e]` e `bg-[#f87171]`)
- ❌ `any` explícito no TypeScript
- ❌ `// @ts-ignore` ou `// @ts-expect-error`
- ❌ Lógica de negócio dentro de `components/ui/`
- ❌ Tipos de domínio definidos dentro de componentes
- ❌ `useState` para estado que pertence ao store global
- ❌ SVG inline em componente (exceto o logotipo em `Sidebar.tsx`)
- ❌ `!important` no CSS
- ❌ Editar manualmente os componentes shadcnUI em `components/ui/` salvo ajustes cosméticos

---

## Antes de abrir um PR

Execute mentalmente este checklist:

- [ ] Nenhum `style={{}}` inline em nenhum arquivo
- [ ] Nenhum SVG inline (exceto o logo da Sidebar)
- [ ] Nenhum ícone que não seja do `lucide-react`
- [ ] Nenhum tipo de domínio fora de `types.ts` ou `api/queueApi.ts`
- [ ] Nenhum estado global em `useState` local
- [ ] Componentes em `ui/` não acessam o store
- [ ] Estrutura de pastas bate com o mapa acima
- [ ] Nomenclatura consistente com as regras acima
- [ ] Acessibilidade mínima presente
- [ ] Testes e2e passando (`pnpm test:e2e`)
- [ ] Testes unitários passando (`pnpm test`)

---

## Auditoria

Quando solicitado a auditar o projeto, reporte **apenas** no formato:

```
## Resultado da Auditoria

### ✅ Aprovado
### 🔧 Corrigido
### ⚠️ Pendente (requer decisão humana)
```
