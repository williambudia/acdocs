"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackPath?: string;
}

export function RouteGuard({ 
  children, 
  requiredPermission,
  fallbackPath = "/dashboard" 
}: RouteGuardProps) {
  const router = useRouter();
  const { user, can, hydrated } = useAuth();

  useEffect(() => {
    // Aguardar hidratação
    if (!hydrated) return;

    // Se não estiver logado, redirecionar para login
    if (!user) {
      router.push("/login");
      return;
    }

    // Se precisar de permissão específica e não tiver, redirecionar
    if (requiredPermission && !can(requiredPermission)) {
      router.push(fallbackPath);
    }
  }, [user, hydrated, requiredPermission, can, router, fallbackPath]);

  // Não renderizar até hidratar
  if (!hydrated) {
    return null;
  }

  // Se não estiver logado, não renderizar
  if (!user) {
    return null;
  }

  // Se precisar de permissão e não tiver, não renderizar
  if (requiredPermission && !can(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
