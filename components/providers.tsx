"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth/context";
import { StoreProvider } from "@/lib/store";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <I18nProvider>
          <AuthProvider>
            <StoreProvider>
              {children}
              <Toaster />
            </StoreProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
