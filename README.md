# RadarAuto

> O marketplace de carros **abaixo da tabela FIPE** — veículos de lojas e revendas verificadas de todo o Brasil, com inteligência de preço pra comprar e vender melhor.

**Status**: 🚀 **Em produção** — [www.radarauto.app](https://www.radarauto.app)

A plataforma combina um marketplace de dois lados (compradores que buscam oportunidades abaixo da FIPE + lojistas/revendedores que anunciam estoque) com tecnologia de scoring de leads, preço recomendado por IA e analytics em tempo real.

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript (strict) + Tailwind
- **Backend**: NestJS 10 + Prisma 6 + PostgreSQL 16
- **Estado**: Zustand (client) + TanStack Query (server)
- **Auth**: JWT multi-sessão + argon2id
- **Monorepo**: pnpm workspaces + Turborepo
- **Qualidade**: ESLint + Prettier + Husky + lint-staged
- **CI/CD**: GitHub Actions + auto-deploy (Vercel/Railway)

## Ambiente de produção

| Camada                 | Serviço  | URL / referência                                                                  |
| ---------------------- | -------- | --------------------------------------------------------------------------------- |
| **Frontend**           | Vercel   | [www.radarauto.app](https://www.radarauto.app) (raiz `radarauto.app` → 308 → www) |
| **API**                | Railway  | [api.radarauto.app](https://api.radarauto.app) · health: `/api/v1/health`         |
| **Banco + Storage**    | Supabase | região `sa-east-1` (São Paulo)                                                    |
| **Email transacional** | Resend   | domínio `radarauto.app` verificado, região `sa-east-1`                            |
| **DNS**                | GoDaddy  | domínio `.app` (HTTPS/HSTS obrigatório)                                           |

> ⚠️ Domínio `.app` exige HTTPS (lista HSTS preload). SSL é automático no Vercel e Railway — sempre acessar via `https://`.

**Fluxo de deploy**: push na branch `main` → Vercel (front) e Railway (API) **redeployam automaticamente**.

### Storage (Supabase buckets, públicos)

- `vehicles` — fotos dos veículos
- `brands` — logos das marcas
- `logos` — logos das lojas / default

## Arquitetura (monorepo)

```
radarauto/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   └── src/app/
│   │       ├── page.tsx            # Landing page (deslogado) / redirect /app (logado)
│   │       ├── Landing.tsx         # Componente da landing
│   │       ├── (public)/           # /login, /cadastro, /convite/[token]
│   │       └── (authed)/app/       # /catalogo, /meus-veiculos, /cadastrar-veiculo,
│   │                               # /leads, /funcionarios, /planos, /configuracao
│   └── api/                        # NestJS backend
│       └── src/modules/            # auth, users, sessions, verification, cnpj, cpf,
│                                   # catalog, vehicles, leads, pricing, brands, fipe,
│                                   # locations, stores, employees, email, storage, health
├── packages/
│   ├── ui/                         # Design system (Button, Modal, Wizard, Brand, etc)
│   ├── types/                      # Tipos de domínio compartilhados (TS puro, sem build)
│   ├── config-eslint/              # ESLint shared
│   ├── config-tsconfig/            # tsconfig presets
│   └── config-tailwind/            # Tailwind preset
├── docs/
│   ├── RULES.md                    # 33 regras de desenvolvimento
│   ├── DEPLOYMENT.md               # Guia de deploy
│   ├── skills/                     # Skills procedurais (checklist + anti-padrões)
│   └── prototype/                  # Protótipo visual de referência
├── .github/workflows/              # CI
└── docker-compose.yml              # Postgres local
```

### Principais módulos da API

| Módulo                          | Responsabilidade                                                       |
| ------------------------------- | ---------------------------------------------------------------------- |
| `auth`                          | Cadastro (lojista/revendedor/funcionário), login, JWT multi-sessão     |
| `verification`                  | OTP por email (Resend em prod, mock em dev) com template próprio       |
| `catalog`                       | Catálogo público com paywall server-side (free vê dados limitados)     |
| `vehicles`                      | CRUD de veículos do lojista (com checagem de `storeId`)                |
| `pricing`                       | Preço recomendado por IA (FIPE −10%, média ponderada por similaridade) |
| `leads`                         | Scoring e gestão de leads (gating premium por loja)                    |
| `stores` / `employees`          | Gestão de loja e convite de funcionários por email                     |
| `brands` / `fipe` / `locations` | Catálogo de marcas, integração FIPE, estados/cidades IBGE              |
| `email` / `storage`             | Provedores plugáveis (Resend/mock, Supabase/local) via factory         |
| `cnpj` / `cpf`                  | Validação e consulta de documentos                                     |

## Pré-requisitos

- **Node.js** ≥ 22 (recomendado via [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- **pnpm** ≥ 9 (`npm i -g pnpm@9.15.0`)
- **Docker** + Docker Compose (pra Postgres local)

## Setup (primeira vez)

```bash
# 1. Clone e instale dependências
pnpm install

# 2. Copia env de exemplo
cp .env.example .env.local
# Edita .env.local com seus valores (DATABASE_URL, JWT_SECRET, etc)

# 3. Sobe Postgres local (porta 5433 no docker-compose)
docker compose up -d

# 4. Roda migrations e gera o client
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate

# 5. Popula com contas de teste + catálogo (recomendado)
pnpm seed                                   # contas de teste (bloqueado em prod)
pnpm --filter @radar/api seed:locations     # 27 estados + 5.571 cidades (IBGE)
pnpm --filter @radar/api seed:brands        # 107 marcas + logos

# 6. Volta pra raiz e inicia tudo
cd ../..
pnpm dev
```

Web em http://localhost:3000 · API em http://localhost:3001/api/v1/health

> O `.env.local` fica na **raiz** do monorepo (`apps/api/.env` é symlink). Postgres local roda em `localhost:5433` (container `radar-postgres`).

## Variáveis de ambiente

Copie `.env.example` → `.env.local` (nunca commitar `.env*` — Regra 30). Em produção, as variáveis ficam no Railway (API) e Vercel (front).

### API (Railway em produção)

| Variável                  | Descrição                                                                        |
| ------------------------- | -------------------------------------------------------------------------------- |
| `NODE_ENV`                | `development` \| `production`                                                    |
| `API_PORT`                | Porta local (3001). Em prod, a API usa a `PORT` injetada pelo Railway            |
| `DATABASE_URL`            | Postgres (Supabase pooled `:6543` com `?pgbouncer=true` em prod) 🔒              |
| `DIRECT_URL`              | Postgres conexão direta (Supabase `:5432`) — usada por migrations 🔒             |
| `JWT_SECRET`              | Segredo de assinatura dos tokens (diferente entre dev e prod) 🔒                 |
| `JWT_EXPIRES_IN`          | Validade do token (`7d`)                                                         |
| `STORAGE_PROVIDER`        | `local` (dev) \| `supabase` (prod)                                               |
| `SUPABASE_URL`            | URL do projeto Supabase                                                          |
| `SUPABASE_SECRET_KEY`     | Service-role key do Supabase (escrita no storage) 🔒                             |
| `SUPABASE_STORAGE_BUCKET` | Bucket default (`logos`)                                                         |
| `EMAIL_PROVIDER`          | `mock` (dev) \| `resend` (prod)                                                  |
| `EMAIL_FROM`              | Remetente (`RadarAuto <noreply@radarauto.app>`)                                  |
| `RESEND_API_KEY`          | API key do Resend 🔒                                                             |
| `WEB_BASE_URL`            | URL do front (`https://www.radarauto.app`) — monta links em emails (ex: convite) |
| `CORS_ORIGINS`            | Origens permitidas, separadas por vírgula (não pode ser `*` com credentials)     |

### Web (Vercel em produção)

| Variável              | Descrição                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL **base** da API **sem** `/api/v1` (o front adiciona o path). Em prod: `https://api.radarauto.app` |

> 🔒 = secreto, **nunca** vai pro Git. Variáveis `NEXT_PUBLIC_*` são embutidas no build do Next — mudá-las exige **redeploy**.

## Deploy

O deploy é contínuo: **push na `main`** dispara redeploy automático no Vercel (front) e Railway (API).

### Configuração de build (Railway, serviço `@radar/api`)

- **Root Directory**: vazio (raiz — necessário pro pnpm linkar `@radar/types`)
- **Build**: `pnpm install --frozen-lockfile && pnpm --filter @radar/api exec prisma generate && pnpm --filter @radar/api build`
- **Start**: `pnpm --filter @radar/api exec node dist/main.js`

### Configuração (Vercel, projeto do front)

- **Root Directory**: `apps/web`
- **Framework**: Next.js (auto-detectado)

### Migrations e seeds em produção

```bash
# Apontando pro Supabase (export DATABASE_URL + DIRECT_URL de produção):
cd apps/api
npx prisma migrate deploy          # aplica migrations
npx prisma db push --skip-generate # sincroniza schema (quando há mudança sem migration)
npx tsx prisma/seed-locations.ts   # estados + cidades
npx tsx prisma/seed-brands.ts      # marcas + logos
```

> ⚠️ **Dívida técnica**: a coluna `subscriptionExpiresAt` existe em dev e prod via `db push`, mas **sem migration formal**. Um `migrate reset` / banco novo não a teria — gerar a migration quando possível.

## Contas de teste (seed local)

Após `pnpm --filter @radar/api seed`, ficam disponíveis 3 contas — senha **`senha12345`** (apenas no banco local; o seed é **bloqueado em produção** via `NODE_ENV`):

| Email                       | Role        | Detalhes                            |
| --------------------------- | ----------- | ----------------------------------- |
| `lojista@radarauto.test`    | Lojista     | Tem loja associada (FlashCar Store) |
| `func@radarauto.test`       | Funcionário | Vinculado à mesma loja              |
| `revendedor@radarauto.test` | Revendedor  | Comprador independente, sem loja    |

## Scripts úteis

```bash
pnpm dev              # roda tudo (web + api) em watch
pnpm build            # build de todos os apps
pnpm lint             # lint em tudo
pnpm typecheck        # checa tipos
pnpm test             # roda testes
pnpm format           # formata com Prettier
pnpm clean            # remove builds + node_modules
```

Por app:

```bash
pnpm --filter @radar/web dev              # só o frontend
pnpm --filter @radar/api dev              # só o backend
pnpm --filter @radar/api seed             # contas de teste
pnpm --filter @radar/api seed:locations   # estados + cidades (IBGE)
pnpm --filter @radar/api seed:brands      # marcas + logos
pnpm --filter @radar/api prisma:studio    # GUI do banco
pnpm --filter @radar/api prisma:migrate   # cria nova migration
```

> ⚠️ `pnpm --filter @radar/web typecheck` tem erros pré-existentes de namespace JSX — o `@radar/api typecheck` deve ficar limpo.

## Testes

Cobertura de segurança e regras de negócio no backend (153 testes em 12 suítes): feed-score, ranking, lead-score, cnpj, cpf, auth, verification, catalog (paywall server-side), promo, listing-ttl, leads (gating premium) e pricing.

```bash
pnpm --filter @radar/api test
```

## Princípios

Toda decisão técnica segue [as 33 regras de desenvolvimento](./docs/RULES.md). Tarefas comuns têm [skills procedurais](./docs/skills/) com checklist e anti-padrões.

1. **UX First** — experiência do usuário sempre prioritária
2. **Design First** — UI mockada antes do backend
3. **Mobile First** — toda tela nasce mobile (inputs ≥ 16px pra evitar zoom no iOS)
4. **Backend é fonte da verdade** — regra de negócio nunca no frontend
5. **Paywall real** — backend filtra dados sensíveis, blur é só UX
6. **Safe changes** — análise de impacto antes de modificar
7. **TypeScript strict** — sem `any`, tipos compartilhados em `@radar/types`
8. **LGPD** — soft-delete, sanitização de logs, auditoria
9. **Erros amigáveis** — catálogo central em `apps/web/src/lib/error-messages.ts`

## Convenções

- **Branches**: `feat/`, `fix/`, `chore/`, `refactor/` + descrição
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, etc)
- **PRs**: descrição com checklist de impacto (skill `safe-change`)
- **Migrations**: nomes descritivos (`add_user_role`, não `update_1`)
- **Erros do backend**: lançar com `{ code: "SCREAMING_CASE", message: "..." }` + entrada no catálogo do frontend

## Documentação adicional

- [Regras de desenvolvimento](./docs/RULES.md)
- [Guia de deploy](./docs/DEPLOYMENT.md)
- [Skills](./docs/skills/)
- [Schema do banco](./apps/api/prisma/schema.prisma)
- [Catálogo de erros amigáveis](./apps/web/src/lib/error-messages.ts)
