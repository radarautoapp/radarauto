/**
 * Root Layout — RadarAuto Web
 *
 * Propósito: layout raiz do App Router. Aplica fontes, CSS globais e providers.
 * Contexto: tudo abaixo herda Tailwind + CSS vars do design system.
 * Regras: PT-BR como padrão (lang="pt-BR"), strict mode habilitado.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RadarAuto — Inteligência automotiva premium",
  description:
    "Marketplace inteligente de veículos com Radar de Oportunidades, scoring de leads e analytics em tempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
