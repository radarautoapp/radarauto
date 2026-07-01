/**
 * /app — redirect por role.
 *
 * Não tem mais "Início". Quando user entra em /app, redireciona pra:
 *   - lojista, funcionario, admin → /app/meus-veiculos
 *   - revendedor                  → /app/catalogo
 *
 * O AuthedLayout já garante sessão válida; aqui só lemos o store.
 */
"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Skeleton } from "@radar/ui";

import { useAuthStore } from "@/stores/auth.store";

export default function AppRedirectPage(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    // Admin nao opera loja: vai direto pra gestao de lojistas.
    // Lojista e revendedor entram pelo Catálogo (vitrine do mercado);
    // funcionário vai para Meus Veículos (gestão da loja).
    const target =
      user.role === "admin"
        ? "/app/admin/dashboard"
        : user.role === "lojista" || user.role === "revendedor"
          ? "/app/catalogo"
          : "/app/meus-veiculos";
    router.replace(target);
  }, [user, router]);

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <Skeleton width="40%" height="28px" style={{ marginBottom: 18 }} />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="90%" height="16px" style={{ marginTop: 8 }} />
    </div>
  );
}
