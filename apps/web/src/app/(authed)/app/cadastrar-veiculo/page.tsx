/**
 * /app/cadastrar-veiculo — hospeda o VehicleWizard.
 *
 * Herda cidade/UF da loja do usuário (via stores-api).
 * Na 4.1c o onComplete vai criar o veículo de verdade no backend.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { storesApi } from "@/lib/stores-api";

import { VehicleWizard } from "./_wizard/VehicleWizard";
import type { VehicleFormState } from "./_wizard/form-state";

export default function CadastrarVeiculoPage(): JSX.Element {
  const router = useRouter();
  const [storeCity, setStoreCity] = useState<string>();
  const [storeState, setStoreState] = useState<string>();

  useEffect(() => {
    storesApi
      .getMine()
      .then((res) => {
        setStoreCity(res.store.city);
        setStoreState(res.store.state);
      })
      .catch(() => {
        /* sem loja (revendedor) — usuário preenche manual */
      });
  }, []);

  const handleComplete = async (form: VehicleFormState): Promise<void> => {
    // 4.1c implementa a criação real (vehiclesApi.create).
    // Por ora, loga e volta pra meus-veículos.
    // eslint-disable-next-line no-console
    console.log("Veículo a cadastrar:", form);
    router.push("/app/meus-veiculos");
  };

  return (
    <div className="page-wrap">
      <VehicleWizard
        storeCity={storeCity}
        storeState={storeState}
        onCancel={() => router.push("/app/meus-veiculos")}
        onComplete={handleComplete}
      />
    </div>
  );
}
