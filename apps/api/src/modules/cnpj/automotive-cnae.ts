/**
 * Verificacao de ramo automotivo por CNAE.
 *
 * A empresa e aceita se o CNAE principal OU qualquer secundario comecar com
 * um dos prefixos abaixo. Criterio abrangente: cobre o nucleo automotivo
 * (divisao 45 inteira) + atividades de intermediacao/repasse/locacao/leasing
 * que revendedores de veiculos costumam usar.
 *
 *   45    — Divisao inteira de comercio/reparacao de veiculos e motos:
 *           4511 venda de carros (novos/usados), 4512 representantes/agentes,
 *           4520 manutencao e reparacao (oficinas), 4530 pecas e acessorios,
 *           4541/4542 motocicletas (venda, pecas, representantes).
 *   6619  — Atividades auxiliares / correspondentes (financiamento de veiculos).
 *   7490  — Agenciamento de negocios em geral (intermediadores / repasse).
 *   7711  — Locacao de automoveis sem condutor (locadoras).
 *   6491  — Arrendamento mercantil (leasing de veiculos).
 *
 * O CNAE pode vir com formatacao (pontos/tracos); normalizamos para apenas
 * digitos antes de comparar o prefixo.
 */
const AUTOMOTIVE_CNAE_PREFIXES = ["45", "6619", "7490", "7711", "6491"];

function digitsOnly(code: string | null | undefined): string {
  return (code ?? "").replace(/\D/g, "");
}

export function isAutomotiveCnae(
  mainActivityCode: string | null,
  secondaryActivityCodes: string[] = [],
): boolean {
  const all = [mainActivityCode, ...secondaryActivityCodes];
  return all.some((raw) => {
    const code = digitsOnly(raw);
    if (!code) return false;
    return AUTOMOTIVE_CNAE_PREFIXES.some((prefix) => code.startsWith(prefix));
  });
}
