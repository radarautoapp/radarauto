/**
 * Funções puras de máscara e formatação.
 * Testáveis isoladas.
 */

export function maskCnpj(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 14);
  const p = (start: number, len: number): string => digits.slice(start, start + len);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${p(0, 2)}.${p(2, 3)}`;
  if (digits.length <= 8) return `${p(0, 2)}.${p(2, 3)}.${p(5, 3)}`;
  if (digits.length <= 12) return `${p(0, 2)}.${p(2, 3)}.${p(5, 3)}/${p(8, 4)}`;
  return `${p(0, 2)}.${p(2, 3)}.${p(5, 3)}/${p(8, 4)}-${p(12, 2)}`;
}

export function maskPhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskEmail(email: string): string {
  if (!email.includes("@")) return email;
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0] ?? ""}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function formatCnpj(cnpj: string): string {
  const d = (cnpj ?? "").replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
