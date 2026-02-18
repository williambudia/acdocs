"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";

export function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      router.push("/dashboard");
    } else {
      setError(t.auth.invalidCredentials);
    }
  };

  const demoAccounts = [
    { email: "owner@docmanager.com", role: "Owner" },
    { email: "admin@docmanager.com", role: "Admin" },
    { email: "manager@docmanager.com", role: "Manager" },
    { email: "user@docmanager.com", role: "User" },
    { email: "reader@docmanager.com", role: "Reader" },
  ];

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="size-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.common.appName}</h1>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t.auth.loginTitle}</CardTitle>
            <CardDescription>{t.auth.loginSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive-foreground">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.common.loading : t.auth.login}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demo Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                onClick={() => {
                  setEmail(account.email);
                  setPassword("demo");
                }}
              >
                <span className="text-foreground truncate">{account.email}</span>
                <span className="ml-2 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {account.role}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
