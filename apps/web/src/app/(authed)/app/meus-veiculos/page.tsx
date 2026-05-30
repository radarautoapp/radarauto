/**
 * /app/meus-veiculos — Veículos da loja do user logado.
 *
 * Placeholder até a Fase 4. Mostra CTA pra cadastrar primeiro veículo.
 */
"use client";

import { Car, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@radar/ui";

export default function MeusVeiculosPage(): JSX.Element {
  const router = useRouter();
  return (
    <div className="page-wrap">
      <header className="page-head">
        <h1 className="page-title">Meus veículos</h1>
        <p className="page-sub">Gerencie todos os veículos da sua loja.</p>
      </header>
      <EmptyState
        icon={Car}
        title="Você ainda não tem veículos cadastrados"
        description="Cadastre seu primeiro veículo. Você pode salvar como rascunho e publicar depois."
        cta={{
          label: "Cadastrar veículo",
          icon: Plus,
          onClick: () => router.push("/app/cadastrar-veiculo"),
        }}
      />
    </div>
  );
}
