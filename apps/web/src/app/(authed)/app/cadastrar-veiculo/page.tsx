/**
 * /app/cadastrar-veiculo — hospeda o VehicleWizard.
 *
 * Modo cadastro: cria o veículo (vehiclesApi.create).
 * Modo edição (?id=...): carrega o veículo, pré-preenche o wizard e atualiza
 * (vehiclesApi.update), montando o photoOrder a partir das fotos (URLs + novas).
 *
 * Herda cidade/UF da loja do usuário (via stores-api) no modo cadastro.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { storesApi } from "@/lib/stores-api";

import { VehicleWizard } from "./_wizard/VehicleWizard";
import { BLANK_VEHICLE_FORM, type VehicleFormState } from "./_wizard/form-state";
import { centsToReais, reaisToCents } from "./_wizard/helpers";
import {
  vehiclesApi,
  type CreateVehiclePayload,
  type VehicleEditData,
} from "./_wizard/vehicles-api";

/** Monta o payload (form -> API) compartilhado por create e update. */
function buildPayload(form: VehicleFormState): CreateVehiclePayload {
  const priceCents = typeof form.priceReais === "number" ? reaisToCents(form.priceReais) : 0;
  return {
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
  };
}

/** Converte o veículo carregado da API para o estado do formulário. */
function editDataToForm(v: VehicleEditData): VehicleFormState {
  return {
    ...BLANK_VEHICLE_FORM,
    brandName: v.brand,
    modelName: v.model,
    yearName: v.version,
    year: v.year,
    yearModel: v.yearModel,
    category: v.category,
    fuel: v.fuel,
    transm: v.transm,
    color: v.color,
    colorHex: v.colorHex,
    km: v.km,
    plate: v.plate ?? "",
    state: v.state,
    city: v.city,
    fipeCents: v.fipe,
    priceReais: centsToReais(v.price),
    optionals: v.optionals,
    delivery: v.delivery,
    obs: v.obs ?? "",
    photos: v.photos,
  };
}

export default function CadastrarVeiculoPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [storeCity, setStoreCity] = useState<string>();
  const [storeState, setStoreState] = useState<string>();

  // Modo edição: carrega o veículo.
  const [editForm, setEditForm] = useState<VehicleFormState | null>(null);
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    let active = true;
    setLoadingEdit(true);
    vehiclesApi
      .findOne(editId)
      .then((v) => {
        if (!active) return;
        setEditForm(editDataToForm(v));
        setEditPhotos(v.photos);
      })
      .catch(() => {
        if (active) setEditError("Não foi possível carregar o veículo para edição.");
      })
      .finally(() => {
        if (active) setLoadingEdit(false);
      });
    return () => {
      active = false;
    };
  }, [editId]);

  // Cadastro novo: herda cidade/UF da loja.
  useEffect(() => {
    if (editId) return;
    storesApi
      .getMine()
      .then((res) => {
        setStoreCity(res.store.city);
        setStoreState(res.store.state);
      })
      .catch(() => {
        /* sem loja (revendedor) — usuário preenche manual */
      });
  }, [editId]);

  const handleComplete = async (
    form: VehicleFormState,
    photos: (File | string)[],
  ): Promise<void> => {
    const payload = buildPayload(form);

    // Separa o array misto em: ordem (URLs ou "new:N") + arquivos novos.
    const photoOrder: string[] = [];
    const newPhotos: File[] = [];
    for (const item of photos) {
      if (typeof item === "string") {
        photoOrder.push(item); // URL existente
      } else {
        photoOrder.push(`new:${newPhotos.length}`);
        newPhotos.push(item);
      }
    }

    if (editId) {
      await vehiclesApi.update(editId, payload, photoOrder, newPhotos);
    } else {
      await vehiclesApi.create(payload, newPhotos);
    }

    router.push("/app/meus-veiculos");
  };

  if (editId && loadingEdit) {
    return (
      <div className="page-wrap">
        <div className="muted" style={{ padding: 40, textAlign: "center" }}>
          Carregando veículo...
        </div>
      </div>
    );
  }

  if (editId && editError) {
    return (
      <div className="page-wrap">
        <div className="auth-error" role="alert" style={{ margin: 20 }}>
          {editError}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <VehicleWizard
        storeCity={storeCity}
        storeState={storeState}
        mode={editId ? "edit" : "create"}
        initialForm={editForm ?? undefined}
        initialPhotoUrls={editId ? editPhotos : undefined}
        onCancel={() => router.push("/app/meus-veiculos")}
        onComplete={handleComplete}
      />
    </div>
  );
}
