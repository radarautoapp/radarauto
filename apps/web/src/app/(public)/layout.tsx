/**
 * (public) layout
 *
 * Layout pra rotas não-autenticadas: /login, /cadastro.
 * Sem sidebar, sem topbar — só passa o children.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return <>{children}</>;
}
