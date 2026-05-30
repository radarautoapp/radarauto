/**
 * StepType — escolha entre Revendedor e Lojista.
 */
import { Crown, Store, User as UserIcon } from "lucide-react";

import { ChoiceCard } from "@radar/ui";

import type { AccountType } from "./types";

export interface StepTypeProps {
  selected: AccountType | null;
  onSelect: (t: AccountType) => void;
}

export function StepType({ selected, onSelect }: StepTypeProps): JSX.Element {
  return (
    <>
      <h1 className="wiz-title">Quem é você?</h1>
      <div className="choice-grid-h">
        <ChoiceCard
          layout="tile"
          icon={UserIcon}
          title="Revendedor"
          description="Busca veículos no marketplace, favorita oportunidades e fala direto com lojistas."
          selected={selected === "revendedor"}
          onSelect={() => onSelect("revendedor")}
        />
        <ChoiceCard
          layout="tile"
          icon={Store}
          title={
            <>
              Lojista
              <Crown size={14} color="var(--trending)" style={{ marginLeft: 4 }} />
            </>
          }
          description="Cadastra veículos, gerencia leads e funcionários, e tem acesso a analytics da loja."
          selected={selected === "lojista"}
          onSelect={() => onSelect("lojista")}
        />
      </div>
    </>
  );
}
