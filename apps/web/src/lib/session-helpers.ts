/**
 * lib/session-helpers.ts
 *
 * Helpers pra renderizar sessões na UI:
 *  - parseUserAgent: extrai navegador e SO de um User-Agent string (sem libs)
 *  - relativeTime: "há 5 minutos", "ontem", etc.
 *  - deviceIcon: nome do ícone pra renderizar (lucide-react)
 */

export interface ParsedUA {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
}

/**
 * Parser leve sem dependência externa. Cobre os browsers/OSs mais comuns.
 * Pra casos exóticos cai em "Desconhecido".
 */
export function parseUserAgent(ua: string | null): ParsedUA {
  if (!ua) {
    return { browser: "Desconhecido", os: "Desconhecido", deviceType: "desktop" };
  }
  const lower = ua.toLowerCase();

  let browser = "Desconhecido";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox/i.test(ua)) browser = "Firefox";

  let os = "Desconhecido";
  if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/mac os|macintosh/i.test(ua)) os = "macOS";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/linux/i.test(ua)) os = "Linux";

  let deviceType: ParsedUA["deviceType"] = "desktop";
  if (/iphone|android.*mobile|blackberry|webos/i.test(ua)) deviceType = "mobile";
  else if (/ipad|tablet|kindle/i.test(ua)) deviceType = "tablet";

  return { browser, os, deviceType };
}

/**
 * "Agora", "há 5 minutos", "ontem", "há 3 dias", "12/04/2026"
 */
export function relativeTime(when: Date | string): string {
  const date = typeof when === "string" ? new Date(when) : when;
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60_000);
  const hour = Math.floor(diffMs / 3_600_000);
  const day = Math.floor(diffMs / 86_400_000);

  if (min < 1) return "Agora";
  if (min < 60) return `Há ${min} minuto${min === 1 ? "" : "s"}`;
  if (hour < 24) return `Há ${hour} hora${hour === 1 ? "" : "s"}`;
  if (day === 1) return "Ontem";
  if (day < 30) return `Há ${day} dia${day === 1 ? "" : "s"}`;

  return date.toLocaleDateString("pt-BR");
}
