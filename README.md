# RadarAuto

> Plataforma premium de inteligência automotiva — marketplace + radar de oportunidades + CRM de leads.

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind
- **Backend**: NestJS 10 + Prisma 6 + PostgreSQL 16
- **Estado**: Zustand (client) + TanStack Query (server)
- **Monorepo**: pnpm workspaces + Turborepo
- **Qualidade**: ESLint + Prettier + Husky + lint-staged
- **CI/CD**: GitHub Actions

## Estrutura

```
radarauto/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── ui/                # Design system (Button, Card, etc)
│   ├── types/             # Tipos de domínio compartilhados
│   ├── config-eslint/     # ESLint shared
│   ├── config-tsconfig/   # tsconfig presets
│   └── config-tailwind/   # Tailwind preset
├── docs/
│   ├── RULES.md           # 33 regras de desenvolvimento
│   └── skills/            # 7 skills procedurais
├── .github/workflows/     # CI
└── docker-compose.yml     # Postgres local
```

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

# 3. Sobe Postgres local
docker compose up -d

# 4. Roda migrations
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate

# 5. Volta pra raiz e inicia tudo
cd ../..
pnpm dev
```

Web em http://localhost:3000 · API em http://localhost:3001/api/v1/health

## Scripts úteis

```bash
pnpm dev              # roda tudo (web + api) em watch
pnpm build            # build de todos os apps
pnpm lint             # lint em tudo
pnpm typecheck        # checa tipos
pnpm test             # roda testes
pnpm format           # formata código com Prettier
pnpm clean            # remove builds + node_modules
```

Scripts específicos por app:

```bash
pnpm --filter @radar/web dev     # só o frontend
pnpm --filter @radar/api dev     # só o backend
pnpm --filter @radar/api prisma:studio   # GUI do banco
```

## Princípios

Toda decisão técnica segue [as 33 regras de desenvolvimento](./docs/RULES.md).
Tarefas comuns têm [skills procedurais](./docs/skills/) com checklist e anti-padrões.

**Resumo dos pilares:**

1. **UX First** — experiência do usuário sempre prioritária
2. **Design First** — UI mockada antes do backend
3. **Mobile First** — toda tela nasce mobile
4. **Backend é fonte da verdade** — regra de negócio nunca no frontend
5. **Paywall real** — backend filtra dados sensíveis, blur é só UX
6. **Safe changes** — análise de impacto antes de modificar
7. **TypeScript strict** — sem `any`, tipos compartilhados
8. **LGPD** — soft-delete, sanitização de logs, auditoria

## Convenções

- **Branches**: `feat/`, `fix/`, `chore/`, `refactor/` + descrição
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, etc)
- **PRs**: descrição com checklist de impacto (skill `safe-change`)
- **Migrations**: nomes descritivos (`add_user_role`, não `update_1`)

## Documentação adicional

- [Regras de desenvolvimento](./docs/RULES.md)
- [Skills](./docs/skills/README.md)
- [Schema do banco](./apps/api/prisma/schema.prisma)
