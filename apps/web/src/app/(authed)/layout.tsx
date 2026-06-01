/**
 * (authed) layout
 *
 * Shell de rotas autenticadas: Sidebar (esquerda) + Topbar (topo) + content.
 * Bloqueia acesso se não houver sessão válida (Regra 10).
 *
 * O `pageTitle` e `pageSubtitle` são providos pelo cada page via context
 * mínimo (useState elevado). Mantém Topbar dinâmica sem prop drilling em
 * cada rota.
 */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LogOut } from "lucide-react";

import { ConfirmModal, Sidebar, Topbar } from "@radar/ui";

import { authApi } from "@/lib/auth-api";
import { storesApi } from "@/lib/stores-api";
import { initialsFromName, navForRole, ROLE_META, SUB_ROUTES } from "@/lib/nav-config";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useAuthExpired } from "@/lib/use-auth-expired";
import { useAuthStore } from "@/stores/auth.store";

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element | null {
  useAuthExpired();

  const { ready, isAuthenticated } = useAuthGuard();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [store, setStore] = useState<{ name: string; logoUrl: string | null } | null>(null);

  // Lojista e funcionário exibem o nome/logo da loja no rodapé da sidebar.
  const hasStore = !!user?.storeId && (user.role === "lojista" || user.role === "funcionario");
  useEffect(() => {
    if (!hasStore) {
      setStore(null);
      return;
    }
    let active = true;
    storesApi
      .getMine()
      .then((res) => {
        if (active) setStore({ name: res.store.name, logoUrl: res.store.logoUrl ?? null });
      })
      .catch(() => {
        if (active) setStore(null);
      });
    return () => {
      active = false;
    };
  }, [hasStore]);

  const navItems = useMemo(() => (user ? navForRole(user.role) : []), [user]);

  const activeId = useMemo(() => {
    if (!pathname) return undefined;
    const match = navItems.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
    if (match) return match.id;
    // sub-rota: herda o destaque do item-pai
    const sub = SUB_ROUTES.find(
      (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
    );
    return sub?.parentId;
  }, [pathname, navItems]);

  if (!ready || !isAuthenticated || !user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--bg)",
        }}
      >
        <div className="muted">Carregando...</div>
      </main>
    );
  }

  const roleMeta = ROLE_META[user.role];
  const displayName = store ? store.name : user.name;
  const sidebarUser = {
    name: displayName,
    initials: initialsFromName(displayName),
    roleLabel: roleMeta.label,
    roleIcon: roleMeta.icon,
    imageUrl: store?.logoUrl ?? null,
  };

  const onSelect = (id: string): void => {
    const target = navItems.find((n) => n.id === id);
    if (target) {
      router.push(target.href);
      setMobileOpen(false);
    }
  };

  const doLogout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      router.replace("/login");
    }
  };

  const pageMeta = inferPageMeta(pathname, navItems);

  return (
    <>
      <ConfirmModal
        open={logoutOpen}
        title="Sair da conta?"
        description="Você precisará fazer login novamente para acessar."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        variant="danger"
        icon={LogOut}
        onConfirm={() => {
          setLogoutOpen(false);
          void doLogout();
        }}
        onCancel={() => setLogoutOpen(false)}
      />
      <div
        className={`sb-backdrop${mobileOpen ? " open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <Sidebar
        items={navItems}
        activeId={activeId}
        onSelect={onSelect}
        user={sidebarUser}
        onLogout={() => setLogoutOpen(true)}
        open={mobileOpen}
        onLogoClick={() => router.push("/app")}
      />
      <div className="main">
        <Topbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          user={sidebarUser}
          onLogout={() => setLogoutOpen(true)}
          onOpenSidebar={() => setMobileOpen(true)}
          onGoSettings={
            navItems.some((n) => n.id === "settings")
              ? () => router.push("/app/configuracao")
              : undefined
          }
        />
        <div className="content">{children}</div>
      </div>
    </>
  );
}

function inferPageMeta(
  pathname: string | null,
  items: ReturnType<typeof navForRole>,
): { title: string; subtitle?: string } {
  if (!pathname) return { title: "RadarAuto" };
  if (pathname === "/app") return { title: "Início", subtitle: "Visão geral da sua conta" };
  // 1. Match EXATO de um item do menu (ex: /app/catalogo = listagem "Catálogo").
  const exact = items.find((n) => pathname === n.href);
  if (exact) return { title: exact.label };
  // 2. Sub-rotas (ex: /app/catalogo/{id} = "Detalhes do Veículo").
  const sub = SUB_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (sub) return { title: sub.title };
  // 3. Fallback: item do menu por prefixo.
  const match = items.find((n) => pathname.startsWith(`${n.href}/`));
  if (match) return { title: match.label };
  return { title: "RadarAuto" };
}
