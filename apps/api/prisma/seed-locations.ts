/**
 * seed-locations.ts
 *
 * Popula State (27) e City (~5.570) do IBGE.
 * Idempotente (upsert). Não depende de Supabase — só dados.
 *
 * Uso:
 *   pnpm --filter @radar/api seed:locations
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades";

interface IbgeState {
  sigla: string;
  nome: string;
  regiao: { nome: string };
}
interface IbgeCity {
  id: number;
  nome: string;
}

async function main(): Promise<void> {
  console.log("Seed de localizacoes (IBGE)...\n");

  // 1. Estados
  const statesRes = await fetch(`${IBGE}/estados?orderBy=nome`);
  if (!statesRes.ok) throw new Error(`IBGE estados: ${statesRes.status}`);
  const states = (await statesRes.json()) as IbgeState[];

  console.log(`Inserindo ${states.length} estados...`);
  for (const s of states) {
    await prisma.state.upsert({
      where: { uf: s.sigla },
      update: { name: s.nome, region: s.regiao.nome },
      create: { uf: s.sigla, name: s.nome, region: s.regiao.nome },
    });
  }
  console.log("  estados ok.\n");

  // 2. Cidades (por estado)
  let totalCities = 0;
  for (const s of states) {
    const citiesRes = await fetch(`${IBGE}/estados/${s.sigla}/municipios`);
    if (!citiesRes.ok) {
      console.log(`  ! falha em ${s.sigla}: ${citiesRes.status}`);
      continue;
    }
    const cities = (await citiesRes.json()) as IbgeCity[];

    // Insere em lote (createMany com skipDuplicates pra idempotencia)
    await prisma.city.createMany({
      data: cities.map((c) => ({
        ibgeCode: String(c.id),
        name: c.nome,
        stateUf: s.sigla,
      })),
      skipDuplicates: true,
    });
    totalCities += cities.length;
    process.stdout.write(`  ${s.sigla}: ${cities.length} cidades\n`);
  }

  console.log(`\nConcluido: ${states.length} estados, ${totalCities} cidades.`);
}

main()
  .catch((err) => {
    console.error("Seed de localizacoes falhou:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
