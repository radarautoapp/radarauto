/**
 * Helpers e constantes do wizard de veículo.
 */

export const CATEGORIES = [
  "Hatch",
  "Sedan",
  "SUV",
  "Caminhonete",
  "Picape",
  "Cupê",
  "Conversível",
  "Minivan",
  "Utilitário",
] as const;

export const FUELS = ["Flex", "Gasolina", "Etanol", "Diesel", "Híbrido", "Elétrico"] as const;

export const TRANSMISSIONS = ["Manual", "Automático"] as const;

export const COLORS: { name: string; hex: string }[] = [
  { name: "Branco", hex: "#f8fafc" },
  { name: "Preto", hex: "#0f172a" },
  { name: "Prata", hex: "#cbd5e1" },
  { name: "Cinza", hex: "#64748b" },
  { name: "Grafite", hex: "#374151" },
  { name: "Chumbo", hex: "#475569" },
  { name: "Vermelho", hex: "#dc2626" },
  { name: "Vinho", hex: "#7f1d1d" },
  { name: "Azul", hex: "#2563eb" },
  { name: "Azul-escuro", hex: "#1e3a8a" },
  { name: "Azul-céu", hex: "#38bdf8" },
  { name: "Verde", hex: "#16a34a" },
  { name: "Verde-escuro", hex: "#166534" },
  { name: "Amarelo", hex: "#eab308" },
  { name: "Laranja", hex: "#ea580c" },
  { name: "Marrom", hex: "#92400e" },
  { name: "Bege", hex: "#d6c9a8" },
  { name: "Dourado", hex: "#caa45d" },
  { name: "Rosa", hex: "#ec4899" },
  { name: "Roxo", hex: "#7c3aed" },
];

export const OPTIONALS_ALL = [
  "Ar-condicionado",
  "Ar-condicionado digital",
  "Direção hidráulica",
  "Direção elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Airbag duplo",
  "Airbag lateral",
  "Airbag de cortina",
  "Freios ABS",
  "Controle de tração",
  "Controle de estabilidade",
  "Som / Multimídia",
  "Central multimídia",
  "Apple CarPlay / Android Auto",
  "Câmera de ré",
  "Câmera 360°",
  "Sensor de estacionamento dianteiro",
  "Sensor de estacionamento traseiro",
  "Bancos de couro",
  "Bancos com aquecimento",
  "Teto solar",
  "Teto panorâmico",
  "Rodas de liga leve",
  "Faróis de LED",
  "Faróis de neblina",
  "Piloto automático",
  "Piloto automático adaptativo",
  "Start/Stop",
  "Partida sem chave (Keyless)",
  "Chave presencial",
  "Volante multifuncional",
  "Computador de bordo",
  "Retrovisores elétricos",
  "Retrovisores rebatíveis",
  "Faróis de xenônio",
  "Sensor de chuva",
  "Sensor de luminosidade",
  "Banco do motorista elétrico",
  "Engate / Reboque",
  "Insulfilm",
  "Alarme",
  "Vidros blindados",
  "GPS / Navegação",
  "Isofix (cadeirinha)",
  "Limpador traseiro",
  "Desembaçador traseiro",
  "Rack de teto",
];

/** Anos: do atual até 22 anos atrás */
export const WZ_YEARS: number[] = Array.from(
  { length: 23 },
  (_, i) => new Date().getFullYear() + 1 - i,
);

/** Infere câmbio pelo nome da versão. */
export function inferTransm(versionName: string): string {
  return /aut|cvt|dsg|tiptronic|s-tronic|automatic/i.test(versionName) ? "Automático" : "Manual";
}

/** Infere combustível pelo nome da versão. */
export function inferFuel(versionName: string): string {
  if (/diesel|tdi|crdi|dci/i.test(versionName)) return "Diesel";
  if (/h[íi]brid|hybrid/i.test(versionName)) return "Híbrido";
  if (/el[ée]tric|electric|\bev\b/i.test(versionName)) return "Elétrico";
  if (/gasolina/i.test(versionName)) return "Gasolina";
  if (/[áa]lcool|etanol/i.test(versionName)) return "Etanol";
  return "Flex";
}

/** Heurística de categoria pelo nome do modelo. */
export function inferCategory(modelName: string): string {
  const m = modelName.toLowerCase();
  if (
    /\b(suv|crossover|tracker|creta|compass|renegade|kicks|t-cross|tcross|nivus|duster|captur|hr-v|hrv|cr-v|crv|tucson|rav4|sw4|pulse|fastback|territory|corolla cross|2008|3008)\b/.test(
      m,
    )
  )
    return "SUV";
  if (
    /\b(hilux|s10|ranger|amarok|toro|strada|saveiro|montana|frontier|oroch|l200|triton|maverick)\b/.test(
      m,
    )
  )
    return "Caminhonete";
  if (
    /\b(sedan|virtus|voyage|prisma|onix plus|cronos|civic|city|corolla|jetta|sentra|versa|cruze|logan|accord|azera)\b/.test(
      m,
    )
  )
    return "Sedan";
  if (
    /\b(hatch|gol|polo|onix|hb20|argo|mobi|kwid|sandero|march|fox|up|fit|yaris|fiesta|focus|golf|i30|uno|palio|ka)\b/.test(
      m,
    )
  )
    return "Hatch";
  return "";
}

/** Extrai o ano de fabricação do nome FIPE do ano (ex: "2022 Diesel" → 2022). */
export function parseYearFromName(name: string): number {
  const m = name.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : new Date().getFullYear();
}

export function centsToReais(cents: number): number {
  return cents / 100;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
