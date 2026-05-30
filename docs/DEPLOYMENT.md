# Deployment — RadarAuto

Estratégia de deploy do RadarAuto.

## Stack de produção

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│   Vercel    │   │   Railway    │   │   Supabase   │
│             │   │              │   │              │
│  Next.js    │←→ │  NestJS API  │←→ │  Postgres    │
│  (frontend) │   │              │   │  Storage     │
└─────────────┘   └──────────────┘   └──────────────┘
```

| Serviço      | Função                                    | Por quê                                        |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| **Vercel**   | Hosting do Next.js (`apps/web`)           | Otimizado pra SSR/ISR/Edge                     |
| **Railway**  | API NestJS containerizada (`apps/api`)    | PaaS estilo Heroku, suporta qualquer container |
| **Supabase** | Postgres gerenciado + Storage de arquivos | S3-compatível, CDN nativo, free tier generoso  |

## Estado atual (desenvolvimento)

- **Postgres**: Docker local (`docker-compose.yml`, porta 5433)
- **Storage**: Local (`apps/api/uploads/` + rota estática `/uploads/*`)
- **Frontend**: `pnpm dev` em `localhost:3000`
- **Backend**: `pnpm dev` em `localhost:3001`

## Roadmap de deploy

### Fase A — Storage no Supabase (já preparado)

A abstração `StorageService` já suporta Supabase. Basta:

```bash
# .env.local
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
SUPABASE_STORAGE_BUCKET=logos
```

E o bucket `logos` no Supabase precisa estar configurado como:

- **Public**: ✅ sim
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Fase B — Migração do Postgres (quando for deploy)

⚠️ **Decisão pendente**: migrar dev pro Supabase Postgres ou manter Docker em dev e usar Supabase só em prod?

**Recomendado**: manter Docker local em dev, usar Supabase em prod.

- Dev: rápido, offline-capable, sem custo de bandwidth
- Prod: gerenciado, backup automático, CDN integrado

**Passos da migração** (futuro):

1. Pegar `DATABASE_URL` do Supabase (Settings → Database → Connection string)
2. Configurar `DATABASE_URL` na Railway (variável de ambiente)
3. Rodar `pnpm --filter @radar/api prisma migrate deploy` apontando pro Supabase
4. Validar conexão

### Fase C — Deploy da API (Railway)

1. Criar projeto na Railway
2. Conectar repositório GitHub
3. Configurar build:
   - **Root directory**: `apps/api`
   - **Build command**: `pnpm install && pnpm prisma:generate && pnpm build`
   - **Start command**: `node dist/main.js`
4. Adicionar variáveis de ambiente (copiar do `.env.local` exceto `DATABASE_URL` que vem do Supabase)
5. Configurar custom domain (opcional)

### Fase D — Deploy do frontend (Vercel)

1. Importar repo no dashboard da Vercel
2. **Root directory**: `apps/web`
3. **Framework preset**: Next.js
4. **Build command**: `cd ../.. && pnpm install && pnpm --filter @radar/web build`
5. Adicionar variável `NEXT_PUBLIC_API_URL` apontando pra URL da Railway

## Notas

- A abstração `StorageService` permite trocar de provider sem mudar código
- Atualmente não usamos Supabase Auth (JWT próprio já implementado)
- Considerar Supabase Auth como migração futura se quisermos OAuth social
