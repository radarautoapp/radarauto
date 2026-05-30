/**
 * CnpjValidator tests
 *
 * Cobertura obrigatória (Regra 27 — regra de negócio crítica).
 */
import { CnpjValidator } from "./cnpj.validator";

describe("CnpjValidator", () => {
  describe("normalize", () => {
    it("remove tudo que não é dígito", () => {
      expect(CnpjValidator.normalize("00.000.000/0000-00")).toBe("00000000000000");
      expect(CnpjValidator.normalize("00 000 000 0000 00")).toBe("00000000000000");
      expect(CnpjValidator.normalize("00-000-000-0000-00")).toBe("00000000000000");
    });

    it("aceita string vazia ou nula", () => {
      expect(CnpjValidator.normalize("")).toBe("");
      expect(CnpjValidator.normalize(null as unknown as string)).toBe("");
    });
  });

  describe("format", () => {
    it("formata um CNPJ válido com máscara", () => {
      expect(CnpjValidator.format("11222333000181")).toBe("11.222.333/0001-81");
    });

    it("retorna o input se não tiver 14 dígitos", () => {
      expect(CnpjValidator.format("123")).toBe("123");
    });
  });

  describe("isValid", () => {
    const VALIDOS = ["11.222.333/0001-81", "00000000000191", "11444777000161"];
    const INVALIDOS = [
      "",
      "1234567890",
      "11.111.111/1111-11",
      "00.000.000/0000-00",
      "11.222.333/0001-82",
      "abc",
    ];

    it.each(VALIDOS)("aceita CNPJ válido: %s", (cnpj) => {
      expect(CnpjValidator.isValid(cnpj)).toBe(true);
    });

    it.each(INVALIDOS)("rejeita CNPJ inválido: %s", (cnpj) => {
      expect(CnpjValidator.isValid(cnpj)).toBe(false);
    });
  });
});
