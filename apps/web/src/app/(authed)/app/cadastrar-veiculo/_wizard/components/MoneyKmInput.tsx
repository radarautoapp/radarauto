/**
 * Inputs especiais do wizard de veículo.
 *
 * MoneyInput — máscara de moeda (R$), valor em reais (number).
 * KmInput — máscara de milhar com sufixo "km".
 *
 * Replicam o comportamento do protótipo.
 */
"use client";

import type { ChangeEvent } from "react";

function brlc(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface MoneyInputProps {
  /** Valor em reais (não centavos). "" quando vazio. */
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: MoneyInputProps): JSX.Element {
  const display = value === "" || value == null ? "" : brlc(value);
  const handle = (e: ChangeEvent<HTMLInputElement>): void => {
    const d = e.target.value.replace(/\D/g, "");
    onChange(d ? parseInt(d, 10) / 100 : "");
  };
  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--muted)",
          fontWeight: 600,
          fontSize: 14,
          pointerEvents: "none",
        }}
      >
        R$
      </span>
      <input
        className="inp"
        style={{ paddingLeft: 42 }}
        inputMode="numeric"
        placeholder={placeholder ?? "0,00"}
        value={display}
        onChange={handle}
        autoFocus={autoFocus}
      />
    </div>
  );
}

export interface KmInputProps {
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder?: string;
}

export function KmInput({ value, onChange, placeholder }: KmInputProps): JSX.Element {
  const n =
    typeof value === "number"
      ? value
      : value === "" || value == null
        ? ""
        : parseInt(String(value).replace(/\D/g, ""), 10);
  const display = n === "" || Number.isNaN(n) ? "" : n.toLocaleString("pt-BR");
  const handle = (e: ChangeEvent<HTMLInputElement>): void => {
    const d = e.target.value.replace(/\D/g, "");
    onChange(d ? parseInt(d, 10) : "");
  };
  return (
    <div style={{ position: "relative" }}>
      <input
        className="inp"
        style={{ paddingRight: 44 }}
        inputMode="numeric"
        placeholder={placeholder ?? "0"}
        value={display}
        onChange={handle}
      />
      <span
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--muted)",
          fontWeight: 600,
          fontSize: 13,
          pointerEvents: "none",
        }}
      >
        km
      </span>
    </div>
  );
}
