# CLAUDE.md — Guia para IA no RadarAuto

> Este arquivo é lido automaticamente por assistentes de IA (Claude Code etc.) no início de cada sessão. Mantenha-o curto e atual.

## Leia primeiro

Antes de trabalhar, leia nesta ordem:

1. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — **features e como se conectam** (mapa + diagramas). Ponto de entrada para entender o projeto.
2. [`docs/RULES.md`](./docs/RULES.md) — convenções e regras numeradas (as "Regras N" citadas nos comentários do código).
3. [`README.md`](./README.md) — visão geral, stack, infra.

Para uma feature específica, vá ao módulo indicado na tabela do ARCHITECTURE.md (§2).

## O que é

Marketplace de carros **abaixo da FIPE**, dois públicos: **compradores** (assinam, veem catálogo com paywall) e **lojistas/revendedores** (anunciam, recebem leads). **Em produção** em www.radarauto.app.

## Stack

Next.js 15 + React 19 + TS strict (front, `apps/web`) · NestJS 10 + Prisma 6 + Postgres 16 (back, `apps/api`) · Zustand + TanStack Query · pnpm + Turborepo · tipos em `packages/types`. Auth: JWT (access 7d + refresh 90d) + argon2id, sessões no banco (revogáveis).

## Convenções essenciais

- **Single source of truth** para navegação (`apps/web/src/lib/nav-config.ts`), tipos (`packages/types`), cliente HTTP (`apps/web/src/lib/api.ts`).
- **Regra de negócio fica no service** do back, nunca no controller (que é fino) nem no front.
- **PII nunca em log** (telefone, CPF, email — Regra 29).
- **Erros padronizados**: `{ code, message }` com code em UPPER_SNAKE (ex: `CNPJ_NOT_AUTOMOTIVE`). Mensagens amigáveis no front via `lib/error-messages.ts`.
- **Validação de sessão a cada request** (`JwtStrategy` → `validateSession`, checa `revokedAt`).
- Mexeu em arquivo que muitos usam (nav-config, api.ts, tipos, schema)? Avalie o impacto sistêmico antes.

## Ao adicionar/alterar features

- **Atualize `docs/ARCHITECTURE.md`** no mesmo passo (tabela de features, diagramas, dependências). Documentação desatualizada é dívida.
- Tipos novos vão em `packages/types` (contrato compartilhado front/back).
- Front: API por feature em `lib/<feature>-api.ts`; tela em `app/(authed|public)/...`.

## Banco (Prisma)

- Schema em `apps/api/prisma/schema.prisma`. Entidades-chave: User, Session, Store, Vehicle, Listing, Lead, Verification, EmployeeInvite.
- ⚠️ **Há drift histórico** (algumas colunas como `subscriptionExpiresAt`, `City`/`State` foram aplicadas via `db push`, sem migration formal). Por isso `prisma migrate dev` pode acusar drift e querer resetar — **nunca aceite reset com dados reais**. Para mudanças simples use `prisma db push`; em produção, aplique SQL direto (DDL pela conexão direta `:5432`, não pelo pooler `:6543?pgbouncer`).

## Deploy (NÃO erre isto)

- **Front (Vercel)** e **API (Railway)** auto-deployam no push para `main`.
- ⚠️ **NUNCA use "Redeploy" no Vercel** esperando pegar commit novo — ele refaz o commit ANTIGO. Use auto-deploy ou "Promote to Production" no commit certo.
- Após reinstalar deps ou mudar schema: rode `pnpm --filter @radar/api exec prisma generate` (senão erros de tipo do Prisma).
- ⚠️ **Vercel Hobby proíbe uso comercial** — migrar para Pro quando faturar. Supabase Free pausa após 7 dias inativo — migrar para Pro.

## Armadilhas conhecidas (custaram tempo)

- **Emojis e acentos:** sempre use caracteres LITERAIS (UTF-8 direto: 🚗 í ç) no código. NUNCA escapes `\uXXXX` — surrogate pairs quebram e viram `�`.
- **SMS desabilitado:** verificação por SMS está temporariamente off (MockSmsProvider não envia em produção). Telefone é coletado sem verificação; `phone/send` retorna `SMS_DISABLED`. Procure `// TODO: reativar` quando integrar SMS real.
- **WhatsApp do lojista:** no detalhe do veículo, use `store.whatsapp` (digitado), não `store.phone` (vem da Receita).
- **Sessão única:** funcionario/revendedor/admin = 1 sessão (login novo revoga anteriores). Lojista = múltiplos dispositivos.

## Não fazer

- Não commitar arquivos `.bak*` nem scripts de teste locais (ex: `create-test-user.mjs`).
- Não expor segredos (senha de banco, chaves) em comandos/commits.
- Não reproduzir lógica de negócio no front.
