"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";

const routeTitles: Record<string, string> = {
  "/dashboard": "dashboard",
  "/categories": "structure",
  "/documents": "documents",
  "/groups": "groups",
  "/users": "users",
  "/audit": "auditLog",
};

function AppLayoutLoading() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  // Always render the same thing on server and first client render
  if (!mounted || !hydrated) {
    return <AppLayoutLoading />;
  }

  if (!isAuthenticated) {
    return <AppLayoutLoading />;
  }

  const titleKey = routeTitles[pathname] || "dashboard";
  const pageTitle = t.nav[titleKey as keyof typeof t.nav] || "";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader title={pageTitle} />
        <div className="flex-1 overflow-auto min-w-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
