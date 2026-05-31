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
import { useMemo, useState } from "react";

import { Sidebar, Topbar } from "@radar/ui";

import { authApi } from "@/lib/auth-api";
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
  const sidebarUser = {
    name: user.name,
    initials: initialsFromName(user.name),
    roleLabel: roleMeta.label,
    roleIcon: roleMeta.icon,
  };

  const onSelect = (id: string): void => {
    const target = navItems.find((n) => n.id === id);
    if (target) {
      router.push(target.href);
      setMobileOpen(false);
    }
  };

  const onLogout = async (): Promise<void> => {
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
        onLogout={onLogout}
        open={mobileOpen}
        onLogoClick={() => router.push("/app")}
      />
      <div className="main">
        <Topbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          user={sidebarUser}
          onLogout={onLogout}
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
  const match = items.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  if (match) return { title: match.label };
  const sub = SUB_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (sub) return { title: sub.title };
  return { title: "RadarAuto" };
}
