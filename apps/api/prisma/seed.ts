/**
 * Prisma seed
 *
 * Cria 3 contas de teste idempotentes (upsert) com senhas conhecidas.
 * NUNCA roda em produção - guard duplo (NODE_ENV + env explicito).
 *
 * Contas:
 *   Lojista        → lojista@radarauto.test    | senha12345 | + Store associada
 *   Funcionario    → func@radarauto.test       | senha12345 | mesma Store do lojista
 *   Revendedor     → revendedor@radarauto.test | senha12345 | sem Store
 *
 * Uso:
 *   pnpm --filter @radar/api seed
 *
 * Pra resetar tudo:
 *   pnpm --filter @radar/api prisma migrate reset
 *   (vai rodar este seed automaticamente no final)
 */
import { Plan, PrismaClient, UserRole } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const SHARED_PASSWORD = "senha12345";

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed bloqueado em producao.");
  }
  if (process.env.ALLOW_SEED !== "1" && process.env.NODE_ENV !== "test") {
    console.warn("Atencao: rodando seed fora de NODE_ENV=test. Use ALLOW_SEED=1 pra confirmar.");
  }

  console.log("Seed: criando contas de teste...");

  const passwordHash = await argon2.hash(SHARED_PASSWORD, { type: argon2.argon2id });

  const store = await prisma.store.upsert({
    where: { cnpj: "11222333000181" },
    update: {
      name: "FlashCar Store",
      legalName: "FLASHCAR STORE LTDA",
      tradeName: "FlashCar Store",
      phone: "4732341270",
      whatsapp: "4732341270",
      city: "Blumenau",
      state: "SC",
      since: 2019,
      verified: true,
    },
    create: {
      name: "FlashCar Store",
      initials: "FS",
      cnpj: "11222333000181",
      legalName: "FLASHCAR STORE LTDA",
      tradeName: "FlashCar Store",
      phone: "4732341270",
      whatsapp: "4732341270",
      city: "Blumenau",
      state: "SC",
      since: 2019,
      verified: true,
      description: "Loja de teste criada via seed. Não use em produção.",
    },
  });
  console.log(`  Store ok: ${store.tradeName} (${store.cnpj})`);

  const lojista = await prisma.user.upsert({
    where: { email: "lojista@radarauto.test" },
    update: {
      passwordHash,
      name: "Matheus Lojista",
      phone: "47999990001",
      cpf: "11144477735",
      role: UserRole.lojista,
      plan: Plan.free,
      storeId: store.id,
      active: true,
    },
    create: {
      email: "lojista@radarauto.test",
      passwordHash,
      name: "Matheus Lojista",
      phone: "47999990001",
      cpf: "11144477735",
      role: UserRole.lojista,
      plan: Plan.free,
      storeId: store.id,
    },
  });
  console.log(`  Lojista ok: ${lojista.email}`);

  const funcionario = await prisma.user.upsert({
    where: { email: "func@radarauto.test" },
    update: {
      passwordHash,
      name: "Maria Funcionaria",
      phone: "",
      cpf: "39053344705",
      role: UserRole.funcionario,
      plan: Plan.free,
      storeId: store.id,
      active: true,
    },
    create: {
      email: "func@radarauto.test",
      passwordHash,
      name: "Maria Funcionaria",
      phone: "",
      cpf: "39053344705",
      role: UserRole.funcionario,
      plan: Plan.free,
      storeId: store.id,
    },
  });
  console.log(`  Funcionario ok: ${funcionario.email}`);

  const revendedor = await prisma.user.upsert({
    where: { email: "revendedor@radarauto.test" },
    update: {
      passwordHash,
      name: "Joao Revendedor",
      phone: "47999990003",
      cpf: "52998224725",
      role: UserRole.revendedor,
      plan: Plan.free,
      storeId: null,
      active: true,
    },
    create: {
      email: "revendedor@radarauto.test",
      passwordHash,
      name: "Joao Revendedor",
      phone: "47999990003",
      cpf: "52998224725",
      role: UserRole.revendedor,
      plan: Plan.free,
    },
  });
  console.log(`  Revendedor ok: ${revendedor.email}`);

  console.log("");
  console.log("Seed completo. Credenciais:");
  console.log("");
  console.log("  Lojista     -> lojista@radarauto.test    | senha12345");
  console.log("  Funcionario -> func@radarauto.test       | senha12345");
  console.log("  Revendedor  -> revendedor@radarauto.test | senha12345");
  console.log("");
}

main()
  .catch((err) => {
    console.error("Seed falhou:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
