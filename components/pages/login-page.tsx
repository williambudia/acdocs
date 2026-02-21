"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Lock, Mail, Shield, FolderTree, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { resetDatabase } from "@/lib/db/operations";

export function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDatabase();
      alert("Banco de dados resetado com sucesso! Tente fazer login novamente.");
    } catch (error) {
      console.error("Erro ao resetar banco:", error);
      alert("Erro ao resetar banco de dados. Veja o console.");
    }
    setResetting(false);
  };

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
    { email: "owner@acdocs.com", role: "Owner" },
    { email: "admin@acdocs.com", role: "Admin" },
    { email: "manager@acdocs.com", role: "Manager" },
    { email: "user@acdocs.com", role: "User" },
    { email: "reader@acdocs.com", role: "Reader" },
  ];

  return (
    <div className="flex min-h-svh">
      {/* Left Section - Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg space-y-8">
          {/* Logo and Title */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <FileText className="size-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">{t.common.appName}</h1>
                <p className="text-muted-foreground">Gerenciamento de Documentos</p>
              </div>
            </div>
          </div>

          {/* Illustration SVG */}
          <div className="relative">
            <svg viewBox="0 0 400 300" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Document Stack */}
              <g opacity="0.9">
                {/* Back document */}
                <rect x="80" y="100" width="180" height="140" rx="8" fill="hsl(var(--primary))" opacity="0.2"/>
                <rect x="90" y="110" width="160" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.3"/>
                <rect x="90" y="120" width="120" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.3"/>
                
                {/* Middle document */}
                <rect x="100" y="80" width="180" height="140" rx="8" fill="hsl(var(--primary))" opacity="0.4"/>
                <rect x="110" y="90" width="160" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.5"/>
                <rect x="110" y="100" width="140" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.5"/>
                <rect x="110" y="110" width="100" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.5"/>
                
                {/* Front document */}
                <rect x="120" y="60" width="180" height="140" rx="8" fill="hsl(var(--primary))" opacity="0.8"/>
                <rect x="130" y="70" width="160" height="6" rx="3" fill="white" opacity="0.9"/>
                <rect x="130" y="85" width="140" height="4" rx="2" fill="white" opacity="0.7"/>
                <rect x="130" y="95" width="120" height="4" rx="2" fill="white" opacity="0.7"/>
                <rect x="130" y="105" width="100" height="4" rx="2" fill="white" opacity="0.7"/>
                
                {/* File icon on front document */}
                <circle cx="210" cy="140" r="25" fill="white" opacity="0.9"/>
                <path d="M 200 135 L 200 145 L 220 145 L 220 135 L 215 135 L 215 130 L 200 130 Z" fill="hsl(var(--primary))"/>
              </g>

              {/* Floating Icons */}
              <g opacity="0.6">
                {/* Shield icon */}
                <circle cx="320" cy="80" r="20" fill="hsl(var(--primary))" opacity="0.2"/>
                <path d="M 320 70 L 315 73 L 315 80 C 315 85 317 88 320 90 C 323 88 325 85 325 80 L 325 73 Z" fill="hsl(var(--primary))"/>
                
                {/* Folder icon */}
                <circle cx="60" cy="180" r="20" fill="hsl(var(--primary))" opacity="0.2"/>
                <path d="M 52 175 L 52 185 L 68 185 L 68 178 L 62 178 L 60 175 Z" fill="hsl(var(--primary))"/>
                
                {/* Users icon */}
                <circle cx="340" cy="200" r="20" fill="hsl(var(--primary))" opacity="0.2"/>
                <circle cx="337" cy="197" r="3" fill="hsl(var(--primary))"/>
                <circle cx="343" cy="197" r="3" fill="hsl(var(--primary))"/>
                <path d="M 333 203 C 333 201 335 200 337 200 C 339 200 341 201 341 203 L 341 205 L 333 205 Z" fill="hsl(var(--primary))"/>
                <path d="M 339 203 C 339 201 341 200 343 200 C 345 200 347 201 347 203 L 347 205 L 339 205 Z" fill="hsl(var(--primary))"/>
              </g>
            </svg>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Seguro e Confiável</h3>
                <p className="text-sm text-muted-foreground">Seus documentos protegidos com criptografia de ponta</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FolderTree className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Organização Inteligente</h3>
                <p className="text-sm text-muted-foreground">Categorias e tipos personalizados para seu negócio</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Colaboração em Equipe</h3>
                <p className="text-sm text-muted-foreground">Controle de acesso e permissões granulares</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex w-full lg:w-1/2 xl:w-2/5 items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="flex lg:hidden flex-col items-center gap-2 mb-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FileText className="size-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t.common.appName}</h1>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="space-y-1 px-0 lg:px-6">
              <CardTitle className="text-2xl">{t.auth.loginTitle}</CardTitle>
              <CardDescription>{t.auth.loginSubtitle}</CardDescription>
            </CardHeader>
            <CardContent className="px-0 lg:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
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

                <div className="space-y-2">
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
                  <div className="rounded-lg bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? t.common.loading : t.auth.login}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Contas de Demonstração
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Clique para preencher automaticamente
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={resetting}
                  className="h-8 gap-2"
                >
                  <RefreshCw className={`size-3 ${resetting ? 'animate-spin' : ''}`} />
                  <span className="text-xs">Resetar DB</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left group"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword("demo");
                  }}
                >
                  <span className="text-foreground truncate group-hover:text-primary transition-colors">
                    {account.email}
                  </span>
                  <span className="ml-2 shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {account.role}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
