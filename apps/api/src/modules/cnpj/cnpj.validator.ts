/**
 * CnpjValidator
 *
 * Lógica PURA de validação de CNPJ (Regra 6: regra de negócio no backend).
 * Sem I/O, sem dependências. 100% unit-testável.
 *
 * Algoritmo:
 *   1. Normaliza pra 14 dígitos (remove pontuação)
 *   2. Rejeita formatos inválidos (≠14 dígitos, todos iguais)
 *   3. Calcula 2 dígitos verificadores pelo algoritmo oficial da Receita
 *   4. Confere com os dígitos do input
 */
export class CnpjValidator {
  static normalize(input: string): string {
    return (input ?? "").replace(/\D/g, "");
  }

  static format(cnpj: string): string {
    const c = this.normalize(cnpj);
    if (c.length !== 14) return cnpj;
    return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
  }

  static isValid(input: string): boolean {
    const cnpj = this.normalize(input);
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;

    const calc = (slice: string, weights: number[]): number => {
      const sum = slice
        .split("")
        .reduce((acc, digit, idx) => acc + Number(digit) * (weights[idx] ?? 0), 0);
      const mod = sum % 11;
      return mod < 2 ? 0 : 11 - mod;
    };

    const W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const d1 = calc(cnpj.slice(0, 12), W1);
    const d2 = calc(cnpj.slice(0, 12) + d1, W2);

    return cnpj[12] === String(d1) && cnpj[13] === String(d2);
  }
}
