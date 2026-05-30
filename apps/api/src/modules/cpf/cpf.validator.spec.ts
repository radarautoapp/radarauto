/**
 * CpfValidator tests
 * Cobertura obrigatória (Regra 27 — regra crítica).
 */
import { CpfValidator } from "./cpf.validator";

describe("CpfValidator", () => {
  describe("normalize", () => {
    it("remove tudo que não é dígito", () => {
      expect(CpfValidator.normalize("123.456.789-09")).toBe("12345678909");
      expect(CpfValidator.normalize("123 456 789 09")).toBe("12345678909");
    });

    it("aceita string vazia ou nula", () => {
      expect(CpfValidator.normalize("")).toBe("");
      expect(CpfValidator.normalize(null as unknown as string)).toBe("");
    });
  });

  describe("format", () => {
    it("formata um CPF válido com máscara", () => {
      expect(CpfValidator.format("12345678909")).toBe("123.456.789-09");
    });

    it("retorna o input se não tiver 11 dígitos", () => {
      expect(CpfValidator.format("123")).toBe("123");
    });
  });

  describe("isValid", () => {
    const VALIDOS = ["123.456.789-09", "11144477735", "529.982.247-25"];
    const INVALIDOS = ["", "123", "111.111.111-11", "000.000.000-00", "12345678900", "abc"];

    it.each(VALIDOS)("aceita CPF válido: %s", (cpf) => {
      expect(CpfValidator.isValid(cpf)).toBe(true);
    });

    it.each(INVALIDOS)("rejeita CPF inválido: %s", (cpf) => {
      expect(CpfValidator.isValid(cpf)).toBe(false);
    });
  });
});
