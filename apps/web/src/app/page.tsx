/**
 * Root Page (/)
 *
 * Redireciona baseado em estado de auth.
 * Como auth é client-side (token em sessionStorage), faz o gate no client.
 *
 * Logado → /app (catálogo / home autenticada)
 * Não-logado → /login
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { tokenStorage } from "@/lib/api";

export default function RootPage(): null {
  const router = useRouter();

  useEffect(() => {
    const token = tokenStorage.get();
    router.replace(token ? "/app" : "/login");
  }, [router]);

  return null;
}
