"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  FolderTree,
  UsersRound,
  Users,
  Upload,
  Download,
  Eye,
  Trash2,
  LogIn,
  Pencil,
  Plus,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { DashboardSkeleton } from "@/components/skeletons";
import { useDocuments } from "@/lib/queries/documents";
import { useCategories } from "@/lib/queries/categories";
import { useGroups } from "@/lib/queries/groups";
import { useUsers } from "@/lib/queries/users";
import { useAuditLogs } from "@/lib/queries/audit";
import type { AuditAction } from "@/lib/types";
import { 
  getExpirationStatus, 
  getDaysUntilExpiration,
  getAccessibleCategories,
  getAccessibleDocuments,
} from "@/lib/types";

const actionIcons: Record<AuditAction, React.ElementType> = {
  upload: Upload,
  download: Download,
  view: Eye,
  delete: Trash2,
  create: Plus,
  update: Pencil,
  login: LogIn,
  logout: LogIn,
};

const actionColors: Record<AuditAction, string> = {
  upload: "bg-chart-2/10 text-chart-2",
  download: "bg-chart-1/10 text-chart-1",
  view: "bg-chart-4/10 text-chart-4",
  delete: "bg-destructive/10 text-destructive-foreground",
  create: "bg-chart-2/10 text-chart-2",
  update: "bg-chart-5/10 text-chart-5",
  login: "bg-chart-3/10 text-chart-3",
  logout: "bg-muted text-muted-foreground",
};

export function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, can } = useAuth();
  
  // React Query hooks
  const { data: documents = [], isLoading: documentsLoading } = useDocuments();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: auditLogs = [], isLoading: auditLoading } = useAuditLogs();
  
  const isLoading = documentsLoading || categoriesLoading || groupsLoading || usersLoading || auditLoading;

  if (isLoading) return <DashboardSkeleton />;

  // Filtrar dados baseado em permissões de grupo
  const accessibleCategories = user ? getAccessibleCategories(user, categories, groups) : [];
  const accessibleDocuments = user ? getAccessibleDocuments(user, documents, categories, groups) : [];

  // Expiration alerts
  const expiredDocs = accessibleDocuments.filter(doc => getExpirationStatus(doc.expiresAt) === "expired");
  const criticalDocs = accessibleDocuments.filter(doc => getExpirationStatus(doc.expiresAt) === "critical");
  const warningDocs = accessibleDocuments.filter(doc => getExpirationStatus(doc.expiresAt) === "warning");
  const alertDocs = [...expiredDocs, ...criticalDocs, ...warningDocs].slice(0, 5);
  const hasAlerts = expiredDocs.length > 0 || criticalDocs.length > 0 || warningDocs.length > 0;

  const stats = [
    {
      label: t.dashboard.totalDocuments,
      value: accessibleDocuments.length,
      icon: FileText,
      href: "/documents",
      show: true, // Todos veem documentos
    },
    {
      label: t.dashboard.totalCategories,
      value: accessibleCategories.length,
      icon: FolderTree,
      href: "/categories",
      show: can("categories:read"), // Apenas quem pode ver categorias
    },
    {
      label: t.dashboard.totalGroups,
      value: groups.length,
      icon: UsersRound,
      href: "/groups",
      show: can("groups:read"), // Apenas quem pode ver grupos
    },
    {
      label: t.dashboard.totalUsers,
      value: users.length,
      icon: Users,
      href: "/users",
      show: can("users:read"), // Apenas quem pode ver usuários
    },
  ].filter(stat => stat.show);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 md:p-6">
      {/* Welcome */}
      <p className="text-sm text-muted-foreground">
        {t.auth.welcomeBack}, {user?.name}
      </p>

      {/* Stats */}
      <div className={`grid gap-4 ${
        stats.length === 1 ? 'grid-cols-1' :
        stats.length === 2 ? 'grid-cols-2' :
        stats.length === 3 ? 'grid-cols-2 lg:grid-cols-3' :
        'grid-cols-2 lg:grid-cols-4'
      }`}>
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(stat.href)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiration Alerts */}
      {hasAlerts && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="size-4 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-base">{t.dashboard.expirationAlerts}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.dashboard.documentsNeedAttention}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/documents">
                  {t.dashboard.viewAll}
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="flex gap-3">
              {expiredDocs.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
                  <AlertTriangle className="size-4 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">{expiredDocs.length}</p>
                    <p className="text-xs text-muted-foreground">{t.dashboard.expired}</p>
                  </div>
                </div>
              )}
              {criticalDocs.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2">
                  <AlertTriangle className="size-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-semibold text-orange-600">{criticalDocs.length}</p>
                    <p className="text-xs text-muted-foreground">{t.dashboard.critical}</p>
                  </div>
                </div>
              )}
              {warningDocs.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2">
                  <Clock className="size-4 text-yellow-700" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-700">{warningDocs.length}</p>
                    <p className="text-xs text-muted-foreground">{t.dashboard.attention}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {alertDocs.map((doc) => {
                const category = accessibleCategories.find((c) => c.id === doc.categoryId);
                const status = getExpirationStatus(doc.expiresAt);
                const days = getDaysUntilExpiration(doc.expiresAt);
                
                const statusConfig = {
                  expired: {
                    icon: AlertTriangle,
                    color: "text-destructive",
                    bg: "bg-destructive/10",
                    text: t.documents.expired,
                  },
                  critical: {
                    icon: AlertTriangle,
                    color: "text-orange-600",
                    bg: "bg-orange-500/10",
                    text: days !== null ? `${days} ${days === 1 ? t.documents.day : t.documents.days}` : t.dashboard.critical,
                  },
                  warning: {
                    icon: Clock,
                    color: "text-yellow-700",
                    bg: "bg-yellow-500/10",
                    text: days !== null ? `${days} ${t.documents.days}` : t.dashboard.attention,
                  },
                  normal: {
                    icon: Clock,
                    color: "text-muted-foreground",
                    bg: "bg-muted",
                    text: "Normal",
                  },
                  none: {
                    icon: Clock,
                    color: "text-muted-foreground",
                    bg: "bg-muted",
                    text: t.documents.noExpiration,
                  },
                };
                
                const config = statusConfig[status];
                const Icon = config.icon;
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-lg border bg-background p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`size-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {category && (
                          <Badge variant="secondary" className="text-xs">
                            {category.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          v{doc.currentVersion}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-semibold ${config.color}`}>
                        {config.text}
                      </p>
                      {doc.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Recent Activity - Apenas para quem pode ver auditoria */}
        {can("audit:read") && (
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{t.dashboard.recentActivity}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {auditLogs.slice(0, 6).map((log) => {
                const Icon = actionIcons[log.action];
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${actionColors[log.action]}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {log.resourceName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.userName} &middot;{" "}
                        {t.audit.actions[log.action as keyof typeof t.audit.actions]}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions + Recent Documents */}
        <div className={`flex min-w-0 flex-col gap-6 ${!can("audit:read") ? "lg:col-span-2" : ""}`}>
          {/* Quick Actions - Apenas se tiver alguma ação disponível */}
          {(can("documents:create") || can("categories:create") || can("groups:update")) && (
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t.dashboard.quickActions}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {can("documents:create") && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/documents">
                      <Upload className="mr-1.5 size-4" />
                      {t.dashboard.uploadDocument}
                    </Link>
                  </Button>
                )}
                {can("categories:create") && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/categories">
                      <Plus className="mr-1.5 size-4" />
                      {t.dashboard.createCategory}
                    </Link>
                  </Button>
                )}
                {can("groups:update") && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/groups">
                      <UsersRound className="mr-1.5 size-4" />
                      {t.dashboard.manageGroups}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.dashboard.recentDocuments}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {accessibleDocuments.slice(0, 5).map((doc) => {
                const category = accessibleCategories.find((c) => c.id === doc.categoryId);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        v{doc.currentVersion}
                      </p>
                    </div>
                    {category && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {category.name}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
