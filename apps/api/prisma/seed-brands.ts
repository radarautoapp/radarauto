/**
 * seed-brands.ts
 *
 * Popula a tabela Brand com marcas da FIPE + logos PNG normalizados no Supabase.
 *
 * Mudança vs versão anterior:
 *  - Só PNG (dataset filippofilip95) — SVGs vinham com proporções inconsistentes
 *  - Normaliza cada logo com sharp: canvas 200x200, contain + padding,
 *    fundo transparente → grid uniforme, sem distorção
 *  - Limpa o bucket antes (remove arquivos antigos svg/png)
 *
 * Uso:
 *   pnpm --filter @radar/api seed:brands
 *
 * Requer: SUPABASE_URL, SUPABASE_SECRET_KEY, bucket "brands" público.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const prisma = new PrismaClient();

const PNG_BASE =
  "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized";

const BUCKET = "brands";
const CANVAS = 200; // px (quadrado)
const PADDING = 12; // px de respiro em cada lado

interface BrandMapEntry {
  fipeCode: string;
  name: string;
  slug: string;
  format: "png" | null;
  popular: boolean;
  order: number;
}

async function normalizeLogo(input: Buffer): Promise<Buffer> {
  const inner = CANVAS - PADDING * 2;
  const resized = await sharp(input)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  return sharp(resized)
    .extend({
      top: PADDING,
      bottom: PADDING,
      left: PADDING,
      right: PADDING,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY sao obrigatorios.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const mapping = JSON.parse(
    readFileSync(join(__dirname, "brand-mapping.json"), "utf-8"),
  ) as BrandMapEntry[];

  console.log(`Seed de marcas (PNG normalizado): ${mapping.length} marcas.\n`);

  // Limpa o bucket (remove logos antigos svg/png)
  console.log("Limpando bucket antigo...");
  try {
    const { data: existing } = await supabase.storage.from(BUCKET).list("", {
      limit: 1000,
    });
    if (existing && existing.length > 0) {
      const paths = existing.map((f) => f.name);
      await supabase.storage.from(BUCKET).remove(paths);
      console.log(`  ${paths.length} arquivos antigos removidos.\n`);
    } else {
      console.log("  bucket ja vazio.\n");
    }
  } catch (err) {
    console.log(`  aviso ao limpar: ${err instanceof Error ? err.message : String(err)}\n`);
  }

  let uploaded = 0;
  let skipped = 0;
  let withInitials = 0;

  for (const entry of mapping) {
    let logoUrl: string | null = null;
    let logoFormat: string | null = null;

    if (entry.format === "png") {
      try {
        const res = await fetch(`${PNG_BASE}/${entry.slug}.png`);
        if (!res.ok) throw new Error(`download ${res.status}`);
        const raw = Buffer.from(await res.arrayBuffer());
        const normalized = await normalizeLogo(raw);

        const path = `${entry.slug}.png`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, normalized, {
          contentType: "image/png",
          upsert: true,
        });
        if (error) throw new Error(`upload: ${error.message}`);

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        logoUrl = data.publicUrl;
        logoFormat = "png";
        uploaded++;
        process.stdout.write(`  ✓ ${entry.name}\n`);
      } catch (err) {
        skipped++;
        process.stdout.write(
          `  ✗ ${entry.name}: ${err instanceof Error ? err.message : String(err)} — iniciais\n`,
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
  console.log("Concluido:");
  console.log(`  Logos enviados:  ${uploaded}`);
  console.log(`  Falhas:          ${skipped}`);
  console.log(`  Sem logo:        ${withInitials} (iniciais)`);
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
