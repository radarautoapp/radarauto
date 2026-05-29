/**
 * Root Layout — RadarAuto Web
 *
 * Propósito: layout raiz do App Router. Aplica fontes, CSS globais e providers.
 * Contexto: tudo abaixo herda Tailwind + CSS vars + TanStack Query.
 */
import type { Metadata } from "next";

import { Providers } from "./providers";
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
