# apps/docs — Landing Page / Site Institucional

## O que é

Site institucional de uma página (landing page) para o EasyQueue.
Construído com Vite + React + TypeScript.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Estilização | Tailwind CSS v4 (design tokens no CSS) |
| Animações | Framer Motion (scroll-reveal, hover, transições) |
| Ícones | Lucide React |
| UI primitives | Radix Slot + CVA (Button, Badge, Card) |
| i18n | react-i18next (pt-BR, en) |
| Fonte | Inter + JetBrains Mono (Google Fonts) |

## Relação com o monorepo

`apps/docs` faz parte do pnpm workspace (`apps/*` no `pnpm-workspace.yaml`).
Isso permite usar `pnpm dev` / `pnpm build` / `pnpm preview` de dentro do diretório.

## Scripts

```bash
pnpm dev       # Vite dev server com hot reload
pnpm build     # tsc -b && vite build (produção em dist/)
pnpm preview   # Vite preview do build
```

## Estrutura

```
apps/docs/
├── index.html                 ← Entry HTML
├── vite.config.ts             ← Vite + React + Tailwind
├── tsconfig.json
├── public/
│   ├── assets/                ← Logo, screenshots, GIF (copiados da raiz)
│   │   ├── logo.svg
│   │   ├── dark.png
│   │   ├── light.png
│   │   └── preview.gif
│   ├── favicon/               ← SVG + ICO + PNGs em vários tamanhos
│   ├── og-image.png           ← OG image rasterizado (1200x630)
│   └── og-image.svg           ← Fonte editável
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx     ← CVA + Radix Slot
│   │   │   ├── Badge.tsx      ← CVA (supported/planned/version)
│   │   │   └── Card.tsx       ← Surface card
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── WhySection.tsx
│   │   ├── PreviewGallery.tsx
│   │   ├── Features.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── Brokers.tsx
│   │   ├── PrivacySection.tsx
│   │   ├── Download.tsx
│   │   ├── DownloadCard.tsx
│   │   ├── Footer.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── i18n/
│   │   ├── index.ts           ← Config react-i18next
│   │   ├── en.ts              ← Tradução inglês
│   │   └── pt-BR.ts           ← Tradução português
│   ├── lib/
│   │   └── utils.ts           ← cn() utility
│   ├── index.css              ← Tailwind + design tokens + glass utilities
│   ├── App.tsx                ← Composição das seções
│   └── main.tsx               ← Entry point
```

## Paleta

Extraída do `LOGO.svg` (gradiente `#6D4AFF → #1E1248`). Definida como design tokens
Tailwind em `src/index.css`:

| Token | Cor | Uso |
|---|---|---|
| `--color-bg-primary` | `#0B0814` | Fundo principal |
| `--color-surface` | `#13102A` | Cards, superfícies |
| `--color-primary` | `#6D4AFF` | Botões, acentos |
| `--color-accent` | `#A78BFA` | Links, highlights |
| `--color-text` | `#FFFFFF` | Texto primário |
| `--color-text-secondary` | `#9D94B8` | Texto secundário |
| `--color-green` | `#22C55E` | Badge "Suportado" |
| `--color-gray-badge` | `#9CA3AF` | Badge "Previsto" |

## Gerando assets (favicon, OG image)

```bash
cd apps/docs
npm install              # sharp + png-to-ico (fora do pnpm workspace)
npm run generate
```
