"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginPage } from "@/components/pages/login-page";
import { useAuth } from "@/lib/auth/context";

export default function LoginRoute() {
  const { isAuthenticated, hydrated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!mounted || !hydrated) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return <LoginPage />;
}
