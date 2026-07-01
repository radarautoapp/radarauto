/**
 * Navigation config
 *
 * Define itens de menu por role. Fase 2: itens mínimos.
 * Vai crescer nas próximas fases (catálogo, leads, planos, etc).
 *
 * Mantém Single source of truth (Regra 13).
 */
import {
  Building2,
  Car,
  Crown,
  Eye,
  LayoutDashboard,
  Settings,
  Tag,
  User as UserIcon,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

import type { StoreSellingStatus, UserRole } from "@radar/types";

export interface NavConfigItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  href: string;
}

export const NAV_ITEMS: Record<string, NavConfigItem> = {
  dashboard: { id: "dashboard", label: "Início", icon: LayoutDashboard, href: "/app" },
  vehicles: { id: "vehicles", label: "Catálogo", icon: Car, href: "/app/catalogo" },
  mine: { id: "mine", label: "Meus veículos", icon: Tag, href: "/app/meus-veiculos" },
  leads: { id: "leads", label: "Visualizações", icon: Eye, href: "/app/leads" },
  team: { id: "team", label: "Funcionários", icon: Users, href: "/app/funcionarios" },
  plans: { id: "plans", label: "Planos", icon: Crown, href: "/app/planos" },
  settings: { id: "settings", label: "Configuração", icon: Settings, href: "/app/configuracao" },
  adminDashboard: {
    id: "adminDashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/app/admin/dashboard",
  },
  adminStores: {
    id: "adminStores",
    label: "Lojistas",
    icon: Building2,
    href: "/app/admin/lojistas",
  },
};

export const NAV_BY_ROLE: Record<UserRole, string[]> = {
  lojista: ["vehicles", "mine", "leads", "team", "plans", "settings"],
  funcionario: ["vehicles", "mine", "leads"],
  revendedor: ["vehicles", "plans"],
  admin: ["adminDashboard", "adminStores"],
};

export const ROLE_META: Record<
  UserRole,
  { label: string; icon: ComponentType<{ size?: number; color?: string }> }
> = {
  lojista: { label: "Lojista", icon: Crown },
  funcionario: { label: "Funcionário", icon: UserIcon },
  revendedor: { label: "Revendedor", icon: UserIcon },
  admin: { label: "Admin", icon: Crown },
};

/**
 * Sub-rotas: páginas que não estão no menu mas pertencem a um item-pai.
 * Mantêm o destaque do menu no item-pai e definem um título próprio na topbar.
 */
export const SUB_ROUTES: { prefix: string; parentId: string; title: string }[] = [
  { prefix: "/app/cadastrar-veiculo", parentId: "mine", title: "Cadastrar veículo" },
  { prefix: "/app/catalogo", parentId: "vehicles", title: "Detalhes do Veículo" },
];

/**
 * Enquanto a loja nao esta aprovada para vender (sellingStatus !== APPROVED),
 * lojista e funcionario navegam com um menu reduzido (sem as telas de venda:
 * Meus veiculos, Visualizacoes, Funcionarios). Aprovacao e feita pelo admin
 * (ver stores.service.setSellingStatus) — nao ha mais autoatendimento.
 */
const REDUCED_NAV: Partial<Record<UserRole, string[]>> = {
  lojista: ["vehicles", "plans", "settings"],
  funcionario: ["vehicles"],
};

export function navForRole(role: UserRole, sellingStatus?: StoreSellingStatus): NavConfigItem[] {
  const needsApproval =
    (role === "lojista" || role === "funcionario") &&
    !!sellingStatus &&
    sellingStatus !== "APPROVED";
  const ids = needsApproval ? (REDUCED_NAV[role] ?? NAV_BY_ROLE[role]) : NAV_BY_ROLE[role];
  return ids.map((id) => NAV_ITEMS[id]).filter((x): x is NavConfigItem => !!x);
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return (first + second).toUpperCase();
}
