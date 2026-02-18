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
  const { user } = useAuth();
  
  // React Query hooks
  const { data: documents = [], isLoading: documentsLoading } = useDocuments();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: auditLogs = [], isLoading: auditLoading } = useAuditLogs();
  
  const isLoading = documentsLoading || categoriesLoading || groupsLoading || usersLoading || auditLoading;

  if (isLoading) return <DashboardSkeleton />;

  const stats = [
    {
      label: t.dashboard.totalDocuments,
      value: documents.length,
      icon: FileText,
      href: "/documents",
    },
    {
      label: t.dashboard.totalCategories,
      value: categories.length,
      icon: FolderTree,
      href: "/categories",
    },
    {
      label: t.dashboard.totalGroups,
      value: groups.length,
      icon: UsersRound,
      href: "/groups",
    },
    {
      label: t.dashboard.totalUsers,
      value: users.length,
      icon: Users,
      href: "/users",
    },
  ];

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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
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

        {/* Quick Actions + Recent Documents */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.dashboard.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/documents">
                  <Upload className="mr-1.5 size-4" />
                  {t.dashboard.uploadDocument}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/categories">
                  <Plus className="mr-1.5 size-4" />
                  {t.dashboard.createCategory}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/groups">
                  <UsersRound className="mr-1.5 size-4" />
                  {t.dashboard.manageGroups}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.dashboard.recentDocuments}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {documents.slice(0, 5).map((doc) => {
                const category = categories.find((c) => c.id === doc.categoryId);
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
