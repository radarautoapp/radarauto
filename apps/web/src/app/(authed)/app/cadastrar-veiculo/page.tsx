/**
 * /app/cadastrar-veiculo — hospeda o VehicleWizard.
 *
 * Herda cidade/UF da loja do usuário (via stores-api).
 * onComplete cria o veículo de verdade (vehiclesApi.create, multipart com fotos).
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { storesApi } from "@/lib/stores-api";

import { VehicleWizard } from "./_wizard/VehicleWizard";
import type { VehicleFormState } from "./_wizard/form-state";
import { reaisToCents } from "./_wizard/helpers";
import { vehiclesApi } from "./_wizard/vehicles-api";

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

  const handleComplete = async (form: VehicleFormState, photos: File[]): Promise<void> => {
    const priceCents = typeof form.priceReais === "number" ? reaisToCents(form.priceReais) : 0;

    await vehiclesApi.create(
      {
        brand: form.brandName,
        model: form.modelName,
        version: form.yearName || form.modelName,
        year: form.year,
        yearModel: form.yearModel,
        km: typeof form.km === "number" ? form.km : 0,
        fuel: form.fuel,
        transm: form.transm,
        color: form.color,
        colorHex: form.colorHex,
        plate: form.plate || undefined,
        category: form.category,
        price: priceCents,
        fipe: form.fipeCents,
        city: form.city,
        state: form.state,
        optionals: form.optionals,
        obs: form.obs || undefined,
        delivery: form.delivery,
      },
      photos,
    );

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
