/**
 * Types compartilhados do wizard de cadastro.
 *
 * Mantém o domínio do wizard isolado de Next/React.
 */

export type AccountType = "revendedor" | "lojista";

export type StepKey =
  | "type"
  | "cnpj"
  | "review"
  | "name"
  | "cpf"
  | "email"
  | "verify-email"
  | "phone"
  | "verify-phone"
  | "password";

export interface UserForm {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
}

export const EMPTY_USER: UserForm = {
  name: "",
  cpf: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirm: "",
};

export const STEPS_BY_TYPE: Record<AccountType, StepKey[]> = {
  revendedor: ["type", "name", "cpf", "email", "verify-email", "phone", "password"],
  lojista: ["type", "cnpj", "review", "name", "cpf", "email", "verify-email", "phone", "password"],
};
