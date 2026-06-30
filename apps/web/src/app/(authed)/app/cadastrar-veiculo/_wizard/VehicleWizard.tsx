/**
 * VehicleWizard — wizard de cadastro de veículo (10 steps).
 *
 * Mecânica: useWizard (@radar/ui). Visual: próprio (carrinho na trilha).
 * FIPE real (marcas do nosso banco, modelos/anos/preço via FipeService).
 * Autosave em localStorage. Preço recomendado via backend.
 *
 * Fotos (step 10) é placeholder — 4.1c implementa upload real.
 */
"use client";

import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Car,
  Check,
  ChevronRight,
  GripVertical,
  ImagePlus,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Truck,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Brand, CityItem, StateItem } from "@radar/types";
import { Badge, Button, useWizard, WizardTrack } from "@radar/ui";

import { brandsApi } from "@/lib/brands-api";
import { fipeApi } from "@/lib/fipe-api";
import { pricingApi } from "@/lib/pricing-api";
import { locationsApi } from "@/lib/locations-api";
import { toFriendlyError } from "@/lib/error-messages";

import { BR_STATES } from "./br-states";
import { FipeCombobox, type FipeOption } from "./components/FipeCombobox";
import { PhotoCropperModal } from "./PhotoCropperModal";
import { KmInput, MoneyInput } from "./components/MoneyKmInput";
import {
  BLANK_VEHICLE_FORM,
  clearDraft,
  loadDraft,
  saveDraft,
  type VehicleFormState,
} from "./form-state";
import {
  brl,
  CATEGORIES,
  COLORS,
  FUELS,
  inferCategory,
  inferFuel,
  inferTransm,
  OPTIONALS_ALL,
  parseYearFromName,
  reaisToCents,
  TRANSMISSIONS,
  WZ_YEARS,
} from "./helpers";

const STEP_META: Record<StepKey, [string, string]> = {
  brand: ["Marca", "Qual a marca do veículo?"],
  model: ["Modelo", "Qual o modelo?"],
  version: ["Versão", "Qual a versão?"],
  year: ["Ano", "Qual o ano?"],
  category: ["Categoria", "Qual a categoria?"],
  specs: ["Especificações", "Ficha técnica"],
  location: ["Localização", "Onde está o veículo?"],
  optionals: ["Opcionais", "Opcionais e entrega"],
  price: ["Preço", "Defina o preço"],
  photos: ["Fotos", "Fotos e finalização"],
};

type StepKey =
  | "brand"
  | "model"
  | "version"
  | "year"
  | "category"
  | "specs"
  | "location"
  | "price"
  | "optionals"
  | "photos";

const STEP_KEYS: StepKey[] = [
  "brand",
  "model",
  "version",
  "year",
  "category",
  "specs",
  "location",
  "optionals",
  "price",
  "photos",
];

export interface VehicleWizardProps {
  /** Estado inicial do formulário (modo edição). */
  initialForm?: VehicleFormState;
  /** URLs das fotos já existentes (modo edição). */
  initialPhotoUrls?: string[];
  /** "create" (padrão) ou "edit". */
  mode?: "create" | "edit";
  /** Cidade/UF da loja (herdadas como default na localização) */
  storeCity?: string;
  storeState?: string;
  onCancel: () => void;
  onComplete: (form: VehicleFormState, photos: (File | string)[]) => Promise<void>;
}

export function VehicleWizard({
  storeCity,
  storeState,
  onCancel,
  onComplete,
  initialForm,
  initialPhotoUrls,
  mode = "create",
}: VehicleWizardProps): JSX.Element {
  const [form, setForm] = useState<VehicleFormState>(() => {
    if (initialForm) return initialForm;
    const draft = loadDraft();
    if (draft) return draft;
    return {
      ...BLANK_VEHICLE_FORM,
      city: storeCity ?? "",
      state: storeState ?? "",
    };
  });

  const set = <K extends keyof VehicleFormState>(key: K, value: VehicleFormState[K]): void =>
    setForm((p) => ({ ...p, [key]: value }));

  // Autosave a cada mudança (só no cadastro novo; edição não usa draft).
  useEffect(() => {
    if (mode === "edit") return;
    saveDraft(form);
  }, [form, mode]);

  // ---- Dados externos ----
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState("");

  const [models, setModels] = useState<FipeOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const [years, setYears] = useState<FipeOption[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);

  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const [fipeLoading, setFipeLoading] = useState(false);

  // Fotos: ficam como File[] no estado (NAO no autosave/localStorage).
  // Em edição, item pode ser URL existente (string) ou File novo.
  const [photoFiles, setPhotoFiles] = useState<(File | string)[]>(() => initialPhotoUrls ?? []);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(() => initialPhotoUrls ?? []);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recommended, setRecommended] = useState<{
    priceCents: number;
    diffPercent: number;
  } | null>(null);

  // Carrega marcas (1x)
  useEffect(() => {
    let active = true;
    brandsApi
      .list()
      .then((res) => {
        if (active) setBrands(res.brands);
      })
      .catch(() => {
        /* silencioso; grid fica vazio */
      })
      .finally(() => {
        if (active) setBrandsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Carrega estados (1x)
  useEffect(() => {
    locationsApi
      .states()
      .then((res) => setStates(res.states))
      .catch(() => setStates([]));
  }, []);

  // Carrega modelos quando a marca muda
  useEffect(() => {
    if (!form.brandCode) {
      setModels([]);
      return;
    }
    let active = true;
    setModelsLoading(true);
    fipeApi
      .models(form.brandCode)
      .then((res) => {
        if (active) setModels(res.models.map((m) => ({ code: m.code, name: m.name })));
      })
      .catch(() => {
        if (active) setModels([]);
      })
      .finally(() => {
        if (active) setModelsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [form.brandCode]);

  // Carrega anos quando o modelo muda
  useEffect(() => {
    if (!form.brandCode || !form.modelCode) {
      setYears([]);
      return;
    }
    let active = true;
    setYearsLoading(true);
    fipeApi
      .years(form.brandCode, form.modelCode)
      .then((res) => {
        if (active) setYears(res.years.map((y) => ({ code: y.code, name: y.name })));
      })
      .catch(() => {
        if (active) setYears([]);
      })
      .finally(() => {
        if (active) setYearsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [form.brandCode, form.modelCode]);

  // Carrega TODAS as cidades do estado (1x quando o estado muda).
  // Filtro é local no combobox — sem busca por tecla (evita perda de foco).
  useEffect(() => {
    if (!form.state) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    locationsApi
      .cities(form.state)
      .then((res) => setCities(res.cities))
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, [form.state]);

  // ---- Fotos ----
  const onPhotoPicked = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (photoFiles.length >= 8) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => setCropperSrc(reader.result as string));
    reader.readAsDataURL(file);
  };

  const onCropConfirm = (blob: Blob): void => {
    const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });
    const preview = URL.createObjectURL(blob);
    setPhotoFiles((prev) => [...prev, file]);
    setPhotoPreviews((prev) => [...prev, preview]);
    setCropperSrc(null);
  };

  const removePhoto = (index: number): void => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      const url = prev[index];
      // Só revoga objectURL de foto nova (blob:); URLs existentes (http) são reais.
      if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const reorderPhotos = (from: number, to: number): void => {
    if (from === to) return;
    setPhotoFiles((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m!);
      return next;
    });
    setPhotoPreviews((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m!);
      return next;
    });
  };

  // ---- Validação por step ----
  const validateStep = (key: StepKey): boolean => {
    switch (key) {
      case "brand":
        return !!form.brandCode;
      case "model":
        return !!form.modelCode;
      case "version":
        return !!form.yearCode; // versão+ano FIPE casados (escolhe o "ano" da FIPE = versão/combustível)
      case "year":
        return !!form.year && !!form.yearModel;
      case "category":
        return !!form.category;
      case "specs":
        return !!form.fuel && !!form.color && form.km !== "";
      case "location":
        return !!form.state && !!form.city.trim();
      case "price":
        return typeof form.priceReais === "number" && form.priceReais > 0;
      case "optionals":
        return true;
      case "photos":
        return photoFiles.length >= 1;
      default:
        return false;
    }
  };

  // Busca preço FIPE ao escolher a versão/ano FIPE
  const onPickFipeYear = async (opt: FipeOption | null): Promise<void> => {
    if (!opt) {
      set("yearCode", "");
      set("yearName", "");
      return;
    }
    set("yearCode", opt.code);
    set("yearName", opt.name);
    // infere câmbio/combustível pelo nome
    set("transm", inferTransm(form.modelName + " " + opt.name));
    set("fuel", inferFuel(form.modelName + " " + opt.name));
    // busca preço FIPE
    setFipeLoading(true);
    try {
      const res = await fipeApi.price(form.brandCode, form.modelCode, opt.code);
      set("fipeCents", res.price.priceCents);
      const y = res.price.modelYear || parseYearFromName(opt.name);
      set("year", y);
      set("yearModel", y);
    } catch {
      // se falhar, mantém sem fipe (usuário digita preço manual)
      set("fipeCents", 0);
      const y = parseYearFromName(opt.name);
      set("year", y);
      set("yearModel", y);
    } finally {
      setFipeLoading(false);
    }
    // infere categoria
    if (!form.category) {
      const cat = inferCategory(form.modelName);
      if (cat) set("category", cat);
    }
  };

  // Em edição, só permite alterar fotos, opcionais e preço (o restante define
  // o veículo e é imutável). No cadastro, usa o fluxo completo.
  const stepKeys: StepKey[] = mode === "edit" ? ["photos", "optionals", "price"] : STEP_KEYS;

  // Busca preço recomendado ao entrar no step de preço
  const wizard = useWizard<StepKey>({
    steps: stepKeys,
    validateStep,
    onComplete: async () => {
      await onComplete(form, photoFiles);
      clearDraft();
    },
  });

  useEffect(() => {
    if (wizard.currentStep === "price" && form.fipeCents > 0 && !recommended) {
      setRecLoading(true);
      pricingApi
        .recommend({
          fipeCents: form.fipeCents,
          brand: form.brandName,
          model: form.modelName,
          category: form.category,
          year: form.year,
          optionals: form.optionals,
        })
        .then((res) => setRecommended({ priceCents: res.priceCents, diffPercent: res.diffPercent }))
        .catch(() => setRecommended(null))
        .finally(() => setRecLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.currentStep, form.fipeCents]);

  const stepIndex = wizard.stepIndex;
  const total = stepKeys.length;
  const isLast = wizard.isLastStep;

  const priceCents = typeof form.priceReais === "number" ? reaisToCents(form.priceReais) : 0;
  const diff =
    form.fipeCents > 0 && priceCents > 0
      ? Math.round(((priceCents - form.fipeCents) / form.fipeCents) * 100)
      : 0;

  // Posição do ponteiro no gauge (0-100%). FIPE = centro (50%).
  // Faixa: -30% (oportunidade, esquerda) a +30% (caro, direita).
  const gaugePct = (() => {
    if (form.fipeCents <= 0 || priceCents <= 0) return 50;
    const clamped = Math.max(-30, Math.min(30, diff));
    return 50 + (clamped / 30) * 50;
  })();

  const toggleOpt = (o: string): void =>
    setForm((p) => ({
      ...p,
      optionals: p.optionals.includes(o) ? p.optionals.filter((x) => x !== o) : [...p.optionals, o],
    }));

  // Busca no backend com debounce: sem texto = grid com logo;
  // com texto = busca todas (alcança marcas raras sem logo).
  useEffect(() => {
    const q = brandSearch.trim();
    const handle = setTimeout(
      () => {
        brandsApi
          .list(q || undefined)
          .then((res) => setBrands(res.brands))
          .catch(() => {
            /* mantém lista atual */
          });
      },
      q ? 300 : 0,
    );
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandSearch]);

  const filteredBrands = brands;

  return (
    <div className="vwz">
      <div className="vwz-top">
        <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ padding: "8px 12px" }}>
          <X size={16} />
          Cancelar
        </button>
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Cadastrar · Passo {stepIndex + 1} de {total}
        </span>
      </div>

      <div className="vwz-title">
        <div className="micro">{STEP_META[wizard.currentStep][0]}</div>
        <h2>{STEP_META[wizard.currentStep][1]}</h2>
      </div>

      <WizardTrack
        totalSteps={total}
        activeIndex={stepIndex}
        icon={mode === "edit" ? Pencil : Car}
      />

      <div className="vwz-anim" key={stepIndex}>
        {/* STEP 0 — MARCA */}
        {wizard.currentStep === "brand" && (
          <div className="card card-p">
            <div className="vwz-search">
              <input
                className="inp"
                placeholder="Buscar marca..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
              />
            </div>
            {brandsLoading ? (
              <div className="muted" style={{ textAlign: "center", padding: 30 }}>
                Carregando marcas...
              </div>
            ) : (
              <div className="vwz-choicegrid">
                {filteredBrands.map((b) => (
                  <button
                    key={b.id}
                    className={`vwz-choice vwz-brand${form.brandCode === b.fipeCode ? " on" : ""}`}
                    onClick={() => {
                      setForm((p) => ({
                        ...p,
                        brandCode: b.fipeCode,
                        brandName: b.name,
                        brandLogoUrl: b.logoUrl,
                        // reset cascata
                        modelCode: "",
                        modelName: "",
                        yearCode: "",
                        yearName: "",
                        fipeCents: 0,
                      }));
                    }}
                  >
                    {b.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="vwz-brand-logo" src={b.logoUrl} alt={b.name} />
                    ) : (
                      <span className="vwz-brand-initials">{b.name.slice(0, 2).toUpperCase()}</span>
                    )}
                    <span className="vwz-brand-name">{b.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 1 — MODELO */}
        {wizard.currentStep === "model" && (
          <div className="card card-p">
            <label className="lbl">Modelo</label>
            <FipeCombobox
              options={models}
              value={form.modelCode}
              loading={modelsLoading}
              onSelect={(o) =>
                setForm((p) => ({
                  ...p,
                  modelCode: o?.code ?? "",
                  modelName: o?.name ?? "",
                  yearCode: "",
                  yearName: "",
                  fipeCents: 0,
                }))
              }
              placeholder="Busque e selecione o modelo"
              emptyText="Nenhum modelo encontrado"
            />
            <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
              Modelos da marca {form.brandName} — direto da Tabela FIPE.
            </div>
          </div>
        )}

        {/* STEP 2 — VERSÃO (ano FIPE = versão+combustível) */}
        {wizard.currentStep === "version" && (
          <div className="card card-p">
            <label className="lbl">Versão / motorização</label>
            <FipeCombobox
              options={years}
              value={form.yearCode}
              loading={yearsLoading || fipeLoading}
              onSelect={(o) => void onPickFipeYear(o)}
              placeholder="Selecione a versão"
              emptyText="Nenhuma versão encontrada"
            />
            {form.yearCode && (
              <div className="ra-flex ra-center ra-wrap" style={{ gap: 8, marginTop: 12 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Preenchemos pra você:
                </span>
                <Badge tone="success" icon={Check}>
                  {form.transm}
                </Badge>
                <Badge tone="success" icon={Check}>
                  {form.fuel}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — ANO (display) */}
        {wizard.currentStep === "year" && (
          <>
            <div className="vwz-year-display">
              <span className={`vwz-year-slot${form.year ? " filled" : ""}`}>
                {form.year || "____"}
              </span>
              <span style={{ color: "var(--muted)", fontWeight: 300 }}>/</span>
              <span className={`vwz-year-slot${form.yearModel ? " filled" : ""}`}>
                {form.yearModel || "____"}
              </span>
            </div>
            <div className="card card-p">
              <div className="ra-flex ra-between ra-center" style={{ marginBottom: 12 }}>
                <span className="micro">Ano de fabricação</span>
              </div>
              <div
                className="muted"
                style={{
                  fontSize: 12.5,
                  display: "flex",
                  gap: 6,
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <Calendar size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                Definido pela versão FIPE selecionada ({form.year}). Agora confirme o ano-modelo.
              </div>

              <span className="micro" style={{ display: "block", marginBottom: 10 }}>
                Ano-modelo
              </span>
              <div className="vwz-choicegrid">
                {[form.year, form.year + 1].map((y) => (
                  <button
                    key={y}
                    className={`vwz-choice${form.yearModel === y ? " on" : ""}`}
                    onClick={() => set("yearModel", y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
                Carros costumam ser fabricados num ano e vendidos como modelo do mesmo ano ou do
                seguinte (ex: 2025/2026).
              </div>
            </div>
          </>
        )}

        {/* STEP 4 — CATEGORIA */}
        {wizard.currentStep === "category" && (
          <div className="card card-p">
            <div className="vwz-choicegrid">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`vwz-choice${form.category === c ? " on" : ""}`}
                  onClick={() => set("category", c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5 — ESPECIFICAÇÕES */}
        {wizard.currentStep === "specs" && (
          <div className="card card-p">
            <label className="lbl">Combustível</label>
            <div className="vwz-choicegrid" style={{ marginBottom: 20 }}>
              {FUELS.map((f) => (
                <button
                  key={f}
                  className={`vwz-choice${form.fuel === f ? " on" : ""}`}
                  onClick={() => set("fuel", f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <label className="lbl">Câmbio</label>
            <div className="vwz-choicegrid" style={{ marginBottom: 20 }}>
              {TRANSMISSIONS.map((t) => (
                <button
                  key={t}
                  className={`vwz-choice${form.transm === t ? " on" : ""}`}
                  onClick={() => set("transm", t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <label className="lbl">Cor</label>
            <div className="vwz-colors" style={{ marginBottom: 20 }}>
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  title={c.name}
                  className={`vwz-color${form.color === c.name ? " on" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => {
                    set("color", c.name);
                    set("colorHex", c.hex);
                  }}
                />
              ))}
            </div>
            {form.color && (
              <div className="muted" style={{ fontSize: 12.5, marginTop: -12, marginBottom: 18 }}>
                Cor selecionada: <strong style={{ color: "var(--text)" }}>{form.color}</strong>
              </div>
            )}

            <div className="vwz-fgrid">
              <div>
                <label className="lbl">Quilometragem</label>
                <KmInput value={form.km} onChange={(v) => set("km", v)} placeholder="48.000" />
              </div>
              <div>
                <label className="lbl">Final da placa (opcional)</label>
                <input
                  className="inp"
                  placeholder="Ex: 7"
                  inputMode="numeric"
                  maxLength={1}
                  value={form.plate}
                  onChange={(e) => set("plate", e.target.value.replace(/\D/g, "").slice(0, 1))}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6 — LOCALIZAÇÃO */}
        {wizard.currentStep === "location" && (
          <div className="card card-p">
            <div className="vwz-fgrid">
              <div>
                <label className="lbl">Estado</label>
                <select
                  className="inp"
                  value={form.state}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, state: e.target.value, city: "" }));
                  }}
                >
                  <option value="">Selecione</option>
                  {states.map((st) => (
                    <option key={st.uf} value={st.uf}>
                      {st.uf} — {st.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="lbl">Cidade</label>
                <FipeCombobox
                  options={cities.map((c) => ({ code: c.name, name: c.name }))}
                  value={form.city}
                  loading={citiesLoading}
                  disabled={!form.state}
                  onSelect={(o) => set("city", o?.name ?? "")}
                  placeholder={form.state ? "Busque a cidade" : "Escolha um estado primeiro"}
                  emptyText="Nenhuma cidade encontrada"
                />
              </div>
            </div>
            <div
              className="muted"
              style={{
                fontSize: 11.5,
                marginTop: 14,
                display: "flex",
                gap: 6,
                alignItems: "flex-start",
              }}
            >
              <MapPin size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              Herdada da sua loja. Ajuste se o veículo está em outro lugar.
            </div>
          </div>
        )}

        {/* STEP 7 — PREÇO */}
        {wizard.currentStep === "price" && (
          <div className="vwz-price">
            {/* Input hero */}
            <div className="vwz-price-hero">
              <span className="vwz-price-label">Seu preço de venda</span>
              <div className="vwz-price-input">
                <span className="vwz-price-currency">R$</span>
                <input
                  className="vwz-price-field"
                  inputMode="numeric"
                  placeholder="0"
                  autoFocus
                  value={
                    form.priceReais === "" || form.priceReais == null
                      ? ""
                      : (form.priceReais as number).toLocaleString("pt-BR")
                  }
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "");
                    set("priceReais", d ? parseInt(d, 10) : "");
                  }}
                />
              </div>
              {priceCents > 0 && form.fipeCents > 0 && (
                <div
                  className="vwz-price-diff"
                  style={{
                    color: diff <= 0 ? "var(--success)" : "var(--danger)",
                    background: diff <= 0 ? "var(--success-t)" : "var(--danger-t)",
                  }}
                >
                  {diff > 0 ? "+" : ""}
                  {diff}% vs FIPE
                  <span className="vwz-price-diff-sub">
                    {priceCents < form.fipeCents
                      ? `R$ ${brl(form.fipeCents - priceCents)} abaixo`
                      : priceCents > form.fipeCents
                        ? `R$ ${brl(priceCents - form.fipeCents)} acima`
                        : "no valor da tabela"}
                  </span>
                </div>
              )}
            </div>

            {/* Gauge: posicao do preco vs FIPE */}
            {form.fipeCents > 0 && (
              <div className="vwz-gauge">
                <div className="vwz-gauge-track">
                  <div className="vwz-gauge-zone vwz-gauge-good" />
                  <div className="vwz-gauge-zone vwz-gauge-bad" />
                  <div className="vwz-gauge-fipe-mark" />
                  {priceCents > 0 && (
                    <div className="vwz-gauge-pointer" style={{ left: `${gaugePct}%` }}>
                      <div className="vwz-gauge-dot" />
                    </div>
                  )}
                </div>
                <div className="vwz-gauge-labels">
                  <span className="vwz-gauge-good-label">Oportunidade</span>
                  <span className="vwz-gauge-fipe-label">FIPE R$ {brl(form.fipeCents)}</span>
                  <span className="vwz-gauge-bad-label">Acima</span>
                </div>
              </div>
            )}

            {/* Cards de referencia */}
            <div className="vwz-price-refs">
              <div className="vwz-ref vwz-ref-fipe">
                <div className="vwz-ref-head">
                  <div className="vwz-ref-icon" style={{ background: "var(--primary)" }}>
                    <BarChart3 size={15} />
                  </div>
                  <span>Tabela FIPE</span>
                </div>
                <div className="vwz-ref-value" style={{ color: "var(--primary)" }}>
                  R$ {form.fipeCents > 0 ? brl(form.fipeCents) : "—"}
                </div>
                <div className="vwz-ref-foot">Referência oficial do mercado</div>
              </div>

              <div className="vwz-ref vwz-ref-rec">
                <div className="vwz-ref-head">
                  <div className="vwz-ref-icon" style={{ background: "var(--trending, #ff6b00)" }}>
                    <Sparkles size={14} />
                  </div>
                  <span>Recomendado</span>
                  <Badge tone="trending" icon={Zap}>
                    RadarAuto
                  </Badge>
                </div>
                {recLoading ? (
                  <div className="vwz-ref-value muted" style={{ fontSize: 16 }}>
                    Calculando...
                  </div>
                ) : recommended ? (
                  <>
                    <div className="vwz-ref-value" style={{ color: "var(--trending, #ff6b00)" }}>
                      R$ {brl(recommended.priceCents)}
                    </div>
                    <button
                      type="button"
                      className="vwz-ref-apply"
                      onClick={() => set("priceReais", recommended.priceCents / 100)}
                    >
                      <Check size={14} />
                      Aplicar este preço
                    </button>
                  </>
                ) : (
                  <div className="vwz-ref-value muted" style={{ fontSize: 16 }}>
                    —
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 8 — OPCIONAIS + ENTREGA */}
        {wizard.currentStep === "optionals" && (
          <>
            <div
              className="card card-p"
              style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: form.delivery ? "var(--success-t)" : "var(--muted-t, #eef2f7)",
                  color: form.delivery ? "var(--success)" : "var(--muted)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Truck size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Oferecer entrega (Car Delivery)</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  O anúncio ganha o selo "Entrega" e aparece no filtro de quem busca entrega.
                </div>
              </div>
              <button
                onClick={() => set("delivery", !form.delivery)}
                className={`toggle${form.delivery ? " on" : ""}`}
                style={{
                  width: 46,
                  height: 27,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: form.delivery ? "var(--success)" : "#cbd5e1",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background .2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: form.delivery ? 22 : 3,
                    width: 21,
                    height: 21,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left .2s",
                  }}
                />
              </button>
            </div>
            <div className="card card-p" style={{ marginTop: 16 }}>
              <span className="micro">Opcionais</span>
              <div className="vwz-optsel" style={{ marginTop: 14 }}>
                {OPTIONALS_ALL.map((o) => (
                  <button
                    key={o}
                    className={form.optionals.includes(o) ? "on" : ""}
                    onClick={() => toggleOpt(o)}
                  >
                    {form.optionals.includes(o) ? <Check size={14} /> : <Plus size={14} />}
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="card card-p" style={{ marginTop: 16 }}>
              <span className="micro">Observações (opcional)</span>
              <div className="muted" style={{ fontSize: 12.5, margin: "4px 0 12px" }}>
                Conte os diferenciais do veículo. Aparece na página do anúncio.
              </div>
              <textarea
                className="inp"
                value={form.obs}
                onChange={(e) => set("obs", e.target.value)}
                maxLength={1000}
                rows={5}
                placeholder="Ex: Único dono, todas as revisões na concessionária, IPVA 2025 pago, pneus novos, aceito troca..."
                style={{
                  resize: "vertical",
                  minHeight: 110,
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
              <div className="muted" style={{ fontSize: 12, textAlign: "right", marginTop: 6 }}>
                {form.obs.length}/1000
              </div>
            </div>
          </>
        )}

        {/* STEP 9 — FOTOS */}
        {wizard.currentStep === "photos" && (
          <div className="card card-p">
            <div className="ra-flex ra-between ra-center" style={{ marginBottom: 6 }}>
              <span className="micro">Fotos do veículo</span>
              <span className="muted" style={{ fontSize: 12 }}>
                {photoFiles.length}/8
              </span>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
              A primeira foto é a capa do anúncio. Arraste para reordenar.
            </div>

            <div className="vwz-photo-grid">
              {photoPreviews.map((src, i) => (
                <div
                  key={src}
                  className={`vwz-photo-tile${dragIndex === i ? " dragging" : ""}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) reorderPhotos(dragIndex, i);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <img src={src} alt={`Foto ${i + 1}`} />
                  {i === 0 && <span className="vwz-photo-cover">Capa</span>}
                  <button
                    type="button"
                    className="vwz-photo-remove"
                    onClick={() => removePhoto(i)}
                    aria-label="Remover foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {photoFiles.length < 8 && (
                <button
                  type="button"
                  className="vwz-photo-add"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus size={24} />
                  <span>Adicionar</span>
                </button>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPhotoPicked}
              style={{ display: "none" }}
            />

            <label className="vwz-terms">
              <button
                type="button"
                role="switch"
                aria-checked={termsAccepted}
                onClick={() => setTermsAccepted((v) => !v)}
                className={`toggle${termsAccepted ? " on" : ""}`}
                style={{
                  width: 46,
                  height: 27,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: termsAccepted ? "var(--success)" : "#cbd5e1",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background .2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: termsAccepted ? 22 : 3,
                    width: 21,
                    height: 21,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left .2s",
                  }}
                />
              </button>
              <span className="vwz-terms-text">
                Li e aceito os termos de uso e a política de privacidade.
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="vwz-foot">
        <div className="vwz-foot-inner">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => (wizard.isFirstStep ? onCancel() : wizard.goBack())}
            disabled={wizard.busy}
          >
            {wizard.isFirstStep ? "Cancelar" : "Voltar"}
          </Button>
          <Button
            variant="primary"
            iconRight={isLast ? Check : ChevronRight}
            onClick={() => void wizard.goNext()}
            disabled={!wizard.canAdvance || wizard.busy || (isLast && !termsAccepted)}
            loading={wizard.busy}
          >
            {isLast ? "Cadastrar veículo" : "Continuar"}
          </Button>
        </div>
      </div>

      {wizard.error && (
        <div className="auth-error" role="alert" style={{ marginTop: 16 }}>
          <span>{wizard.error}</span>
        </div>
      )}

      {cropperSrc && (
        <PhotoCropperModal
          imageSrc={cropperSrc}
          onCancel={() => setCropperSrc(null)}
          onConfirm={onCropConfirm}
        />
      )}
    </div>
  );
}
