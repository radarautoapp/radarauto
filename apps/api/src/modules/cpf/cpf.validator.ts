/**
 * CpfValidator
 *
 * Lógica pura de validação de CPF (Regra 6).
 * Sem I/O, sem deps. 100% unit-testável.
 *
 * Algoritmo:
 *   1. Normaliza para 11 dígitos (remove pontuação)
 *   2. Rejeita formatos inválidos (≠11 dígitos, todos iguais)
 *   3. Calcula 2 dígitos verificadores
 *   4. Confere com os dígitos do input
 */
export class CpfValidator {
  static normalize(input: string): string {
    return (input ?? "").replace(/\D/g, "");
  }

  static format(cpf: string): string {
    const c = this.normalize(cpf);
    if (c.length !== 11) return cpf;
    return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
  }

  static isValid(input: string): boolean {
    const cpf = this.normalize(input);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    const calc = (slice: string, factor: number): number => {
      let sum = 0;
      for (let i = 0; i < slice.length; i++) {
        sum += Number(slice[i]) * (factor - i);
      }
      const mod = (sum * 10) % 11;
      return mod === 10 ? 0 : mod;
    };

    const d1 = calc(cpf.slice(0, 9), 10);
    const d2 = calc(cpf.slice(0, 10), 11);

    return cpf[9] === String(d1) && cpf[10] === String(d2);
  }
}
