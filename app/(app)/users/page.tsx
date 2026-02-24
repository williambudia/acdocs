"use client";

import { UsersPage } from "@/components/pages/users-page";
import { RouteGuard } from "@/components/route-guard";

export default function UsersRoute() {
  return (
    <RouteGuard requiredPermission="users:read">
      <UsersPage />
    </RouteGuard>
  );
}
