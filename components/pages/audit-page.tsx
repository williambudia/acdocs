"use client";

import { useState } from "react";
import { AuditSkeleton } from "@/components/skeletons";
import { useAuditLogs } from "@/lib/queries/audit";
import {
  ClipboardList,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Pencil,
  LogIn,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
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

const actionBadgeColors: Record<AuditAction, string> = {
  upload: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  download: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  view: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  delete: "bg-destructive/10 text-destructive-foreground border-destructive/20",
  create: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  update: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  login: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  logout: "bg-muted text-muted-foreground border-border",
};

export function AuditPage() {
  const { t } = useI18n();
  const { data: auditLogs = [], isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.resourceName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase())
  );

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <AuditSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {auditLogs.length} registros
        </p>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Audit Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.audit.action}</TableHead>
                  <TableHead>{t.audit.user}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t.audit.resource}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t.audit.details}
                  </TableHead>
                  <TableHead className="text-right">
                    {t.audit.timestamp}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const Icon = actionIcons[log.action];
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${actionBadgeColors[log.action]}`}
                        >
                          <Icon className="mr-1 size-3" />
                          {t.audit.actions[log.action as keyof typeof t.audit.actions]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {log.userName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {log.resourceName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.resourceType}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {log.details || "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="size-8 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          {t.common.noResults}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
