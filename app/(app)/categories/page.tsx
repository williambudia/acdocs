"use client";

import { CategoriesPage } from "@/components/pages/categories-page";
import { RouteGuard } from "@/components/route-guard";

export default function CategoriesRoute() {
  return (
    <RouteGuard requiredPermission="categories:read">
      <CategoriesPage />
    </RouteGuard>
  );
}
