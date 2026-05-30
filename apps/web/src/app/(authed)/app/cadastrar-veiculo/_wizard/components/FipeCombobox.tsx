/**
 * FipeCombobox
 *
 * Combobox de busca pra modelos/versões FIPE. Trabalha com opções que têm
 * { code, name } (diferente do Combobox do protótipo que era só string).
 *
 * Mostra o name, retorna o item selecionado (code + name) via onSelect.
 */
"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export interface FipeOption {
  code: string;
  name: string;
}

export interface FipeComboboxProps {
  options: FipeOption[];
  /** code selecionado (ou "") */
  value: string;
  onSelect: (option: FipeOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
  loading?: boolean;
  /** Se fornecido, chamado quando o texto muda (busca externa no backend) */
  onSearch?: (query: string) => void;
}

export function FipeCombobox({
  options,
  value,
  onSelect,
  placeholder,
  disabled,
  emptyText = "Nenhuma opção encontrada",
  loading = false,
  onSearch,
}: FipeComboboxProps): JSX.Element {
  const selected = options.find((o) => o.code === value);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(selected?.name ?? "");

  // Sincroniza o texto quando o value muda externamente (ex: reset, autosave)
  useEffect(() => {
    setQ(selected?.name ?? "");
  }, [selected?.name]);

  const filtered = onSearch
    ? options // busca externa: backend ja filtrou, mostra tudo
    : options.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase()));

  const pick = (o: FipeOption): void => {
    onSelect(o);
    setQ(o.name);
    setOpen(false);
  };

  const onType = (val: string): void => {
    setQ(val);
    setOpen(true);
    // Busca externa (backend) se fornecida
    if (onSearch) onSearch(val);
    // Se o texto não bate exatamente com nada, limpa a seleção
    const exact = options.find((o) => o.name.toLowerCase() === val.trim().toLowerCase());
    onSelect(exact ?? null);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          className="inp"
          style={{ paddingRight: 34 }}
          placeholder={loading ? "Carregando..." : placeholder}
          value={q}
          disabled={disabled || loading}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <ChevronDown
          size={16}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
            pointerEvents: "none",
          }}
        />
      </div>
      {open && !disabled && !loading && (
        <div className="cbx-pop">
          {filtered.length ? (
            filtered.map((o) => (
              <button
                key={o.code}
                type="button"
                className={`cbx-opt${o.code === value ? " on" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
              >
                {o.name}
                {o.code === value && <Check size={15} />}
              </button>
            ))
          ) : (
            <div className="cbx-empty">{emptyText}</div>
          )}
        </div>
      )}
    </div>
  );
}
