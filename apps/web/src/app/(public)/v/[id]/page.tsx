/**
 * /v/[id] — Pagina publica de PREVIEW de um veiculo (compartilhamento).
 *
 * Serve dois propositos:
 * 1. Robos (WhatsApp, etc.) leem as Open Graph tags geradas no servidor
 *    (generateMetadata) e mostram um card com a foto + dados do carro.
 * 2. Pessoas reais sao redirecionadas para /app/catalogo/[id] (onde o paywall
 *    e a autenticacao agem). O conteudo real NUNCA fica publico aqui.
 */
import type { Metadata } from "next";

import { PreviewRedirect } from "./PreviewRedirect";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

type Preview = {
  id: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  transm: string;
  fuel: string;
  price: number;
  fipe: number;
  city: string;
  state: string;
  coverPhoto: string | null;
};

async function fetchPreview(id: string): Promise<Preview | null> {
  try {
    const res = await fetch(`${API}/api/v1/catalog/${id}/preview`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Preview;
  } catch {
    return null;
  }
}

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const num = (n: number) => n.toLocaleString("pt-BR");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await fetchPreview(id);

  if (!p) {
    return {
      title: "RadarAuto — Carros abaixo da tabela FIPE",
      description: "Veiculos de lojas verificadas com preco abaixo da FIPE.",
    };
  }

  const desconto = p.fipe > p.price ? Math.round((1 - p.price / p.fipe) * 100) : 0;
  const titulo = `${p.brand} ${p.model} ${p.year} — R$ ${brl(p.price)}`;
  const desc =
    `${num(p.km)} km · ${p.transm} · ${p.fuel} · ${p.city}/${p.state}` +
    (desconto > 0 ? ` · ${desconto}% abaixo da FIPE` : "");

  return {
    title: titulo,
    description: desc,
    openGraph: {
      title: titulo,
      description: desc,
      type: "website",
      locale: "pt_BR",
      siteName: "RadarAuto",
      images: p.coverPhoto ? [{ url: p.coverPhoto, width: 1200, height: 630, alt: titulo }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: desc,
      images: p.coverPhoto ? [p.coverPhoto] : [],
    },
  };
}

export default async function PublicVehiclePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PreviewRedirect id={id} />;
}
