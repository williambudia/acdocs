import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Dashboard ───────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 md:p-6">
      {/* Welcome */}
      <Skeleton className="h-4 w-48" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-2">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions + Recent Documents */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-36 rounded-md" />
              ))}
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2">
                  <Skeleton className="size-4 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Categories ──────────────────────────────────────────────

export function CategoriesSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-2 p-4 md:py-2 md:px-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 flex-1 sm:max-w-64 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      {/* Category Cards Grid */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex min-w-0 flex-col overflow-hidden !gap-2 !py-2">
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="size-4 shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 px-4 !py-0">
              <div className="flex flex-col gap-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                    <Skeleton className="size-3.5 shrink-0" />
                    <Skeleton className="size-3.5 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="mt-auto px-4 py-3">
              <Skeleton className="h-6 w-full rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Documents ───────────────────────────────────────────────

export function DocumentsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 flex-1 sm:w-56 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-14" /></TableHead>
                  <TableHead className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-4 shrink-0" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-10 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Skeleton className="size-7 rounded-md" />
                        <Skeleton className="size-7 rounded-md" />
                        <Skeleton className="size-7 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Groups ──────────────────────────────────────────────────

export function GroupsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 flex-1 sm:w-64 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <div>
                <Skeleton className="mb-1.5 h-3 w-20" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="mb-1.5 h-3 w-32" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Users ───────────────────────────────────────────────────

export function UsersSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 flex-1 sm:w-64 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                  <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-14" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Skeleton className="size-7 rounded-md" />
                        <Skeleton className="size-7 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Audit ───────────────────────────────────────────────────

export function AuditSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 sm:w-64 rounded-md" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-14" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-3 w-28" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
