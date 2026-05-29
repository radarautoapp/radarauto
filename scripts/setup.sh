#!/usr/bin/env bash
# RadarAuto — setup automatizado pra primeira vez

set -e

echo "🚀 RadarAuto — Setup"
echo "===================="

# Check Node version
if ! node -v | grep -qE "^v(2[2-9]|[3-9][0-9])"; then
  echo "❌ Node.js >= 22 necessário. Use nvm: nvm install 22 && nvm use 22"
  exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo "📦 Instalando pnpm..."
  npm i -g pnpm@9.15.0
fi

# Install deps
echo "📦 Instalando dependências..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy env
if [ ! -f .env.local ]; then
  echo "📝 Criando .env.local a partir do exemplo..."
  cp .env.example .env.local
  echo "⚠️  EDITE .env.local com seus valores antes de continuar"
fi

# Start Postgres
if command -v docker &> /dev/null; then
  echo "🐘 Subindo Postgres local..."
  docker compose up -d
  echo "⏳ Aguardando Postgres ficar pronto..."
  sleep 5
else
  echo "⚠️  Docker não encontrado. Configure DATABASE_URL pra um Postgres acessível."
fi

# Prisma
echo "🗄️  Gerando Prisma Client..."
cd apps/api
pnpm prisma:generate
echo "🗄️  Rodando migrations..."
pnpm prisma:migrate || echo "⚠️  Migrations falharam — verifique DATABASE_URL"
cd ../..

echo ""
echo "✅ Setup completo!"
echo ""
echo "Para iniciar: pnpm dev"
echo "  Web → http://localhost:3000"
echo "  API → http://localhost:3001/api/v1/health"
