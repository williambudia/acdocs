"use client";

import { AuditPage } from "@/components/pages/audit-page";
import { RouteGuard } from "@/components/route-guard";

export default function AuditRoute() {
  return (
    <RouteGuard requiredPermission="audit:read">
      <AuditPage />
    </RouteGuard>
  );
}
