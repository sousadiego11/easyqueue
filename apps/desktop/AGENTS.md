# AGENTS.md — EasyQueue

Este arquivo é a fonte de verdade para qualquer agente de IA trabalhando neste repositório.
Leia tudo antes de escrever qualquer linha de código.

---

## O que é este projeto

**EasyQueue** é uma interface web de monitoramento e debugging de filas de mensagens (SQS, RabbitMQ, Kafka).
Público-alvo: engenheiros backend e DevOps.
O produto precisa transmitir confiabilidade, densidade de informação e controle.

---

## Stack — sem negociação

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript (Vite) |
| Estilo | **Tailwind CSS** + **shadcnUI** |
| Ícones | **Lucide React** — e nada mais |
| Roteamento | React Router v6 |
| Estado global | Zustand |
| Data mock | Arquivos `.ts` locais em `src/mocks/` |

**Ícones:** use sempre o componente do `lucide-react`. Se o ícone não existir no Lucide, abra uma issue antes de criar SVG manual. A única exceção aceita é o logotipo do produto na `Sidebar.tsx`.

---

## Estrutura de pastas

A estrutura abaixo é obrigatória — não é sugestão. Todo arquivo novo segue este mapa.

```
src/
├── styles/
│   └── index.css             ← @tailwind base/components/utilities + CSS custom properties
├── components/
│   └── ui/                   ← shadcnUI components (gerados via `npx shadcn add`)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── tabs.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── separator.tsx
│       └── ... (outros conforme necessário)
├── features/
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── ConnectionList.tsx
│   │   └── QueueList.tsx
│   ├── messages/
│   │   ├── MessageTable.tsx
│   │   ├── MessageFilters.tsx
│   │   └── Pagination.tsx
│   ├── detail/
│   │   ├── DetailPanel.tsx
│   │   ├── MessageMeta.tsx
│   │   └── MessageActions.tsx
│   └── publisher/
│       └── Publisher.tsx
├── mocks/
│   ├── connections.ts
│   ├── queues.ts
│   └── messages.ts
├── stores/
│   ├── useAppStore.ts
│   ├── useConnectionStore.ts
│   └── useMessageStore.ts
├── types.ts                  ← todos os tipos globais do projeto
├── App.tsx
└── main.tsx
```

### Regras de organização

- `components/ui/` → componentes shadcnUI (genéricos, sem lógica de negócio)
- `features/` → componentes com lógica de negócio, acesso ao store, consumo de mocks
- Nenhum arquivo na raiz de `src/` além de `App.tsx`, `main.tsx` e `types.ts`
- Nenhum componente com nome genérico sem contexto (`Card.tsx`, `Item.tsx`, `Component.tsx`)

---

## Regras de estilo

### Tema dark/light

Usamos a estratégia `class` do Tailwind. O toggle de tema adiciona/remove a classe `dark` no `<html>`:

```ts
// stores/useAppStore.ts
toggleTheme: () => {
  const next = get().theme === 'light' ? 'dark' : 'light'
  document.documentElement.classList.toggle('dark', next === 'dark')
  localStorage.setItem('theme', next)
  set({ theme: next })
}
```

### Cores

Todas as cores são definidas como CSS custom properties no `styles/index.css`, usando a convenção de `hsl()` do shadcnUI. O seletor `:root` contém o tema light, `.dark` contém o tema dark.

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

Tailwind aplica essas variáveis via `tailwind.config.ts` mapeando para as cores utilitárias (`bg-background`, `text-foreground`, `border`, etc.).

### Tailwind — como usar

- Use **utility classes** diretamente no JSX: `className="flex items-center gap-2 p-3"`
- Prefira as cores do tema: `bg-background`, `text-foreground`, `text-muted-foreground`, `border`
- Evite valores hardcoded: `text-red-500` só em casos excepcionais
- Para variantes use Tailwind: `dark:bg-gray-800`, `hover:bg-accent`

### shadcnUI — como usar

- Todos os componentes shadcnUI ficam em `components/ui/`
- Use `npx shadcn@latest add [component]` para adicionar novos
- **Nunca edite** os componentes shadcnUI manualmente (a não ser para ajustes cosméticos mínimos)
- Prefira os componentes shadcnUI prontos (Button, Badge, Dialog, Tabs, etc.) a criar versões próprias

### O padrão esperado num componente de feature

```tsx
function MessageFilters() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <select className="h-7 px-2 rounded-md border bg-background">...</select>
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
  currentConnectionId: string | null
  setCurrentConnectionId: (id: string | null) => void
}
```

**Nunca** use `useState` para: tema, fila ativa, mensagem selecionada, estado do modal, tab ativa, conexão atual.

---

## Tipos globais (types.ts)

Todos os tipos compartilhados ficam em `src/types.ts`. Nenhum tipo de domínio é definido dentro de componente.

```ts
export type Theme = 'light' | 'dark'

export type ConnectionType = 'SQS' | 'RabbitMQ' | 'Kafka'

export interface Connection {
  id: string
  name: string
  type: ConnectionType
  status: 'online' | 'offline'
}

export interface Queue {
  id: string
  name: string
  count: number
}

export type EventType =
  | 'OrderCreated'
  | 'OrderConfirmed'
  | 'OrderShipped'
  | 'OrderDelivered'
  | 'PaymentApproved'
  | 'PaymentCaptured'
  | 'InventoryReserved'
  | 'NotificationQueued'
  | 'EmailSent'

export interface Message {
  id: string
  queue: string
  payload: unknown
  timestamp: Date
  headers?: Record<string, string>
  raw?: unknown
}
```

---

## Layout

```
┌──────────────┬─────────────────────────────┬────────────────────┐
│  Sidebar     │  Painel Central             │  Painel Detalhe    │
│  240px fixo  │  flex: 1                    │  420px fixo        │
│              │                             │  (oculto se null)  │
└──────────────┴─────────────────────────────┴────────────────────┘
```

- Container raiz: `display: flex`, `height: 100vh`, `overflow: hidden`
- Cada painel: `overflow-y: auto` internamente
- Painel de detalhe: só renderiza quando `selectedMessage !== null`

---

## Badges de event type

| Event type | Variante |
|---|---|
| OrderCreated, OrderConfirmed, OrderShipped, OrderDelivered | `blue` |
| PaymentApproved, PaymentCaptured | `green` |
| InventoryReserved, NotificationQueued | `yellow` |
| EmailSent | `purple` |

---

## Acessibilidade mínima (não negociável)

- Todo `<img>` tem `alt`
- Todo `IconButton` e `CopyButton` tem `aria-label`
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

## O que nunca fazer

- ❌ `style={{ }}` inline em qualquer lugar
- ❌ Cores, fontes ou espaçamentos hardcoded que deveriam usar tokens do tema
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
- [ ] Nenhum tipo de domínio fora de `types.ts`
- [ ] Nenhum estado global em `useState` local
- [ ] Componentes em `ui/` não acessam o store
- [ ] Estrutura de pastas bate com o mapa acima
- [ ] Nomenclatura consistente com as regras acima
- [ ] Acessibilidade mínima presente

---

## Auditoria

Quando solicitado a auditar o projeto, reporte **apenas** no formato:

```
## Resultado da Auditoria

### ✅ Aprovado
### 🔧 Corrigido
### ⚠️ Pendente (requer decisão humana)
```
