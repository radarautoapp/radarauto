/**
 * StepCnpj — input de CNPJ com debounce, consulta API, exibe erros tipados.
 */
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import type { CnpjLookupResponse } from "@radar/types";
import { FormField, Input } from "@radar/ui";

import { ApiClientError } from "@/lib/api";
import { cnpjApi } from "@/lib/cnpj-api";

import { maskCnpj } from "./masks";

export interface CnpjStepError {
  title: string;
  message: string;
}

export interface StepCnpjProps {
  cnpjInput: string;
  setCnpjInput: (v: string) => void;
  cnpjData: CnpjLookupResponse | null;
  setCnpjData: (d: CnpjLookupResponse | null) => void;
  cnpjLoading: boolean;
  setCnpjLoading: (b: boolean) => void;
  cnpjError: CnpjStepError | null;
  setCnpjError: (e: CnpjStepError | null) => void;
  disabled: boolean;
}

export function StepCnpj({
  cnpjInput,
  setCnpjInput,
  cnpjData,
  setCnpjData,
  cnpjLoading,
  setCnpjLoading,
  cnpjError,
  setCnpjError,
  disabled,
}: StepCnpjProps): JSX.Element {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueriedRef = useRef<string>("");

  useEffect(() => {
    const digits = cnpjInput.replace(/\D/g, "");
    if (cnpjData && cnpjData.cnpj !== digits) {
      setCnpjData(null);
      setCnpjError(null);
    }
    if (digits.length !== 14) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      lastQueriedRef.current = "";
      return;
    }
    if (digits === lastQueriedRef.current && cnpjData) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      lastQueriedRef.current = digits;
      setCnpjLoading(true);
      setCnpjError(null);
      try {
        const data = await cnpjApi.lookup(digits);
        if (data.status !== "ATIVA") {
          setCnpjData(null);
          setCnpjError({
            title: "CNPJ não está ativo",
            message: `Situação na Receita: ${data.status}. Apenas empresas ATIVAS podem cadastrar lojas.`,
          });
        } else {
          setCnpjData(data);
        }
      } catch (err) {
        setCnpjData(null);
        const { code, message } = resolveError(err);
        const titleMap: Record<string, string> = {
          CNPJ_NOT_FOUND: "CNPJ não encontrado",
          INVALID_CNPJ_FORMAT: "CNPJ inválido",
          CNPJ_LOOKUP_UNAVAILABLE: "Serviço indisponível",
          CNPJ_ALREADY_EXISTS: "CNPJ já cadastrado",
          NETWORK_ERROR: "Sem conexão",
        };
        setCnpjError({
          title: titleMap[code] ?? "Erro na consulta",
          message,
        });
      } finally {
        setCnpjLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cnpjInput, cnpjData, setCnpjData, setCnpjError, setCnpjLoading]);

  return (
    <>
      <h1 className="wiz-title">Qual o CNPJ da sua loja?</h1>
      <FormField
        label="CNPJ"
        htmlFor="cnpj"
        hint={cnpjData ? "CNPJ confirmado." : "14 dígitos. Apenas empresas ativas."}
      >
        <div className="cnpj-input-wrap">
          <Input
            id="cnpj"
            value={cnpjInput}
            onChange={(e) => setCnpjInput(maskCnpj(e.target.value))}
            disabled={disabled || cnpjLoading}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            autoComplete="off"
            invalid={!!cnpjError}
            required
            autoFocus
          />
          <div className="cnpj-input-state">
            {cnpjLoading && <Loader2 size={18} className="spin" />}
            {cnpjData && !cnpjLoading && <Check size={18} color="var(--success)" />}
          </div>
        </div>
      </FormField>

      {cnpjError && !cnpjLoading && (
        <div className="cnpj-error" role="alert" style={{ marginTop: 14 }}>
          <AlertCircle size={18} className="ic" />
          <div style={{ flex: 1 }}>
            <div className="cnpj-error-title">{cnpjError.title}</div>
            <div className="cnpj-error-msg">{cnpjError.message}</div>
          </div>
        </div>
      )}

      {cnpjData && !cnpjLoading && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "var(--success-t)",
            borderRadius: 12,
            color: "var(--success)",
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Check size={16} />
          {cnpjData.legalName}
        </div>
      )}
    </>
  );
}
