"use client";

import { useEffect } from "react";

/**
 * Redireciona pessoas reais para o app (onde auth + paywall agem).
 * Os robos de preview leem as OG tags antes do JS rodar, entao pegam o card.
 */
export function PreviewRedirect({ id }: { id: string }) {
  useEffect(() => {
    window.location.replace(`/app/catalogo/${id}`);
  }, [id]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#64748B",
        background: "#fff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#0B1220" }}>RadarAuto</div>
        <div style={{ marginTop: 8, fontSize: 14 }}>Abrindo o anúncio…</div>
      </div>
    </div>
  );
}
