"use client";

import { GroupsPage } from "@/components/pages/groups-page";
import { RouteGuard } from "@/components/route-guard";

export default function GroupsRoute() {
  return (
    <RouteGuard requiredPermission="groups:read">
      <GroupsPage />
    </RouteGuard>
  );
}
