/**
 * ChoiceCard
 *
 * Card grande de seleção (usado em wizards pra escolhas relevantes).
 * Suporta dois layouts via prop `layout`:
 *  - "list" (default): horizontal compacto, vários empilhados (ex: lista de opções)
 *  - "tile": vertical/quadrado, geralmente em grid de 2-3 colunas (ex: tipo de conta)
 */
import { Check } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export interface ChoiceCardProps {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title: ReactNode;
  description: ReactNode;
  selected?: boolean;
  onSelect: () => void;
  layout?: "list" | "tile";
}

export function ChoiceCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
  layout = "list",
}: ChoiceCardProps): JSX.Element {
  if (layout === "tile") {
    return (
      <button
        type="button"
        className={`choice-card-h${selected ? " on" : ""}`}
        onClick={onSelect}
        aria-pressed={selected}
      >
        <div className="choice-card-h-check">{selected && <Check size={14} strokeWidth={3} />}</div>
        <div className="choice-card-h-icon">
          <Icon size={24} strokeWidth={2} />
        </div>
        <div>
          <div className="choice-card-h-title">{title}</div>
          <div className="choice-card-h-desc" style={{ marginTop: 4 }}>
            {description}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`choice-card${selected ? " on" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="choice-card-icon">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="choice-card-title">{title}</div>
        <div className="choice-card-desc">{description}</div>
      </div>
      <div className="choice-card-check">{selected && <Check size={14} strokeWidth={3} />}</div>
    </button>
  );
}
