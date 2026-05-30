/**
 * seed-brands.ts
 *
 * Popula a tabela Brand com as marcas da FIPE + logos no Supabase Storage.
 *
 * Fluxo (idempotente, upsert por fipeCode):
 *   1. Lê brand-mapping.json (de-para FIPE → slug/formato, gerado offline)
 *   2. Pra cada marca com logo: baixa o arquivo (SVG do tipstrade ou PNG do
 *      filippofilip95), faz upload pro bucket "brands" do Supabase
 *   3. Upsert no banco com logoUrl + logoFormat + popular + order
 *
 * Uso:
 *   pnpm --filter @radar/api seed:brands
 *
 * Requer no .env: SUPABASE_URL, SUPABASE_SECRET_KEY
 * O bucket "brands" precisa existir e ser público (read).
 *
 * Pra re-rodar do zero: o upsert atualiza tudo, então é seguro rodar N vezes.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const SVG_BASE = "https://raw.githubusercontent.com/tipstrade/node-vehicle-logos/master/assets";
const PNG_BASE =
  "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized";

const BUCKET = "brands";

interface BrandMapEntry {
  fipeCode: string;
  name: string;
  slug: string;
  format: "svg" | "png" | null;
  popular: boolean;
  order: number;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY sao obrigatorios pra rodar este seed.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const mappingPath = join(__dirname, "brand-mapping.json");
  const mapping = JSON.parse(readFileSync(mappingPath, "utf-8")) as BrandMapEntry[];

  console.log(`Seed de marcas: ${mapping.length} marcas no mapping.\n`);

  let uploaded = 0;
  let skipped = 0;
  let withInitials = 0;

  for (const entry of mapping) {
    let logoUrl: string | null = null;
    let logoFormat: string | null = null;

    if (entry.format) {
      try {
        const srcUrl =
          entry.format === "svg"
            ? `${SVG_BASE}/${entry.slug}.svg`
            : `${PNG_BASE}/${entry.slug}.png`;

        const res = await fetch(srcUrl);
        if (!res.ok) {
          throw new Error(`download ${res.status}`);
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        const path = `${entry.slug}.${entry.format}`;
        const contentType = entry.format === "svg" ? "image/svg+xml" : "image/png";

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, buffer, { contentType, upsert: true });

        if (error) {
          throw new Error(`upload: ${error.message}`);
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        logoUrl = data.publicUrl;
        logoFormat = entry.format;
        uploaded++;
        process.stdout.write(`  ✓ ${entry.name} (${entry.format})\n`);
      } catch (err) {
        skipped++;
        process.stdout.write(
          `  ✗ ${entry.name}: ${err instanceof Error ? err.message : String(err)} — usara iniciais\n`,
        );
      }
    } else {
      withInitials++;
    }

    await prisma.brand.upsert({
      where: { fipeCode: entry.fipeCode },
      update: {
        name: entry.name,
        slug: entry.slug,
        logoUrl,
        logoFormat,
        popular: entry.popular,
        order: entry.order,
      },
      create: {
        fipeCode: entry.fipeCode,
        name: entry.name,
        slug: entry.slug,
        logoUrl,
        logoFormat,
        popular: entry.popular,
        order: entry.order,
      },
    });
  }

  console.log("");
  console.log(`Concluido:`);
  console.log(`  Logos enviados:  ${uploaded}`);
  console.log(`  Falhas:          ${skipped}`);
  console.log(`  Sem logo:        ${withInitials} (usarao iniciais)`);
  console.log(`  Total no banco:  ${mapping.length}`);
}

main()
  .catch((err) => {
    console.error("Seed de marcas falhou:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
