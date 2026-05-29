#!/usr/bin/env bash
set -e

if [ ! -f "package.json" ] || ! grep -q '"name": "radarauto"' package.json; then
  echo "Erro: rode este script da raiz do projeto radarauto/"
  exit 1
fi

echo "Aplicando Fase 2 — Auth no projeto..."
echo ""

PHASE2_DIR="$(dirname "$0")"

echo "[1/8] Atualizando schema do Prisma..."
cp "$PHASE2_DIR/prisma/schema.prisma" apps/api/prisma/schema.prisma

echo "[2/8] Atualizando @radar/types..."
cp "$PHASE2_DIR/types/index.ts" packages/types/src/index.ts
cp "$PHASE2_DIR/types/session.ts" packages/types/src/domain/session.ts
cp "$PHASE2_DIR/types/auth.ts" packages/types/src/api/auth.ts

echo "[3/8] Atualizando dependências da API..."
cp "$PHASE2_DIR/api/package.json" apps/api/package.json

echo "[4/8] Criando módulo Prisma..."
mkdir -p apps/api/src/prisma
cp "$PHASE2_DIR/api/prisma.service.ts" apps/api/src/prisma/prisma.service.ts
cp "$PHASE2_DIR/api/prisma.module.ts" apps/api/src/prisma/prisma.module.ts

echo "[5/8] Criando módulo Auth..."
mkdir -p apps/api/src/modules/auth/dto
cp "$PHASE2_DIR/api/auth.service.ts" apps/api/src/modules/auth/auth.service.ts
cp "$PHASE2_DIR/api/auth.service.spec.ts" apps/api/src/modules/auth/auth.service.spec.ts
cp "$PHASE2_DIR/api/auth.controller.ts" apps/api/src/modules/auth/auth.controller.ts
cp "$PHASE2_DIR/api/auth.module.ts" apps/api/src/modules/auth/auth.module.ts
cp "$PHASE2_DIR/api/jwt.strategy.ts" apps/api/src/modules/auth/jwt.strategy.ts
cp "$PHASE2_DIR/api/dto-login.dto.ts" apps/api/src/modules/auth/dto/login.dto.ts
cp "$PHASE2_DIR/api/dto-register-revendedor.dto.ts" apps/api/src/modules/auth/dto/register-revendedor.dto.ts
cp "$PHASE2_DIR/api/dto-register-lojista.dto.ts" apps/api/src/modules/auth/dto/register-lojista.dto.ts
cp "$PHASE2_DIR/api/dto-register-funcionario.dto.ts" apps/api/src/modules/auth/dto/register-funcionario.dto.ts

echo "[6/8] Criando guards, decorators..."
mkdir -p apps/api/src/common/guards apps/api/src/common/decorators
cp "$PHASE2_DIR/api/jwt-auth.guard.ts" apps/api/src/common/guards/jwt-auth.guard.ts
cp "$PHASE2_DIR/api/role.guard.ts" apps/api/src/common/guards/role.guard.ts
cp "$PHASE2_DIR/api/public.decorator.ts" apps/api/src/common/decorators/public.decorator.ts
cp "$PHASE2_DIR/api/roles.decorator.ts" apps/api/src/common/decorators/roles.decorator.ts
cp "$PHASE2_DIR/api/current-user.decorator.ts" apps/api/src/common/decorators/current-user.decorator.ts

echo "[7/8] Atualizando AppModule + Health..."
cp "$PHASE2_DIR/api/app.module.ts" apps/api/src/app.module.ts
cp "$PHASE2_DIR/api/health.controller.ts" apps/api/src/modules/health/health.controller.ts

echo "[8/8] Criando páginas e libs do frontend..."
mkdir -p apps/web/src/lib apps/web/src/stores apps/web/src/app/login apps/web/src/app/cadastro
cp "$PHASE2_DIR/web/api.ts" apps/web/src/lib/api.ts
cp "$PHASE2_DIR/web/auth-api.ts" apps/web/src/lib/auth-api.ts
cp "$PHASE2_DIR/web/use-session.ts" apps/web/src/lib/use-session.ts
cp "$PHASE2_DIR/web/auth.store.ts" apps/web/src/stores/auth.store.ts
cp "$PHASE2_DIR/web/providers.tsx" apps/web/src/app/providers.tsx
cp "$PHASE2_DIR/web/layout.tsx" apps/web/src/app/layout.tsx
cp "$PHASE2_DIR/web/home-page.tsx" apps/web/src/app/page.tsx
cp "$PHASE2_DIR/web/login-page.tsx" apps/web/src/app/login/page.tsx
cp "$PHASE2_DIR/web/cadastro-page.tsx" apps/web/src/app/cadastro/page.tsx

echo ""
echo "Arquivos copiados. Próximos passos:"
echo "  1. pnpm install"
echo "  2. cd apps/api && pnpm prisma:migrate dev --name add_sessions"
echo "  3. cd ../.. && pnpm dev"
