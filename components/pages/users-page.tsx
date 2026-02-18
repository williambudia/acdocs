"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UsersSkeleton } from "@/components/skeletons";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/lib/queries/users";
import { useGroups } from "@/lib/queries/groups";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import type { User, Role } from "@/lib/types";

const roleBadgeVariants: Record<Role, string> = {
  owner: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  admin: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  manager: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  user: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  reader: "bg-muted text-muted-foreground border-border",
};

export function UsersPage() {
  const { t } = useI18n();
  const { can, isRole } = useAuth();
  
  // React Query hooks
  const { data: users = [], isLoading } = useUsers();
  const { data: groups = [] } = useGroups();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<Role>("user");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canCreate = isRole("owner", "admin");
  const canEdit = can("users:update");
  const canDelete = isRole("owner");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserRole("user");
    setShowDialog(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!userName.trim() || !userEmail.trim()) return;
    setSaving(true);
    
    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          updates: {
            name: userName.trim(),
            email: userEmail.trim(),
            role: userRole,
          }
        });
        toast.success(t.toast.userUpdated);
      } else {
        await createUserMutation.mutateAsync({
          name: userName.trim(),
          email: userEmail.trim(),
          role: userRole,
          groupIds: [],
        });
        toast.success(t.toast.userCreated);
      }
      setShowDialog(false);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success(t.toast.userDeleted);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    }
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return <UsersSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {users.length} {t.users.title.toLowerCase()}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.common.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {canCreate && (
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="mr-1.5 size-4" />
              {t.users.newUser}
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.users.userName}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t.users.userEmail}
                  </TableHead>
                  <TableHead>{t.users.userRole}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t.groups.title}
                  </TableHead>
                  <TableHead className="text-right">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const userGroups = groups.filter((g) =>
                    g.memberIds.includes(u.id)
                  );
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                            {u.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {u.name}
                            </p>
                            <p className="text-xs text-muted-foreground sm:hidden truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${roleBadgeVariants[u.role]}`}
                        >
                          <Shield className="mr-1 size-3" />
                          {t.users.roles[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {userGroups.map((g) => (
                            <Badge
                              key={g.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {g.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => openEditDialog(u)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          {canDelete && u.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive-foreground hover:text-destructive-foreground"
                              onClick={() => setDeleteConfirm(u.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-8 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          {t.users.noUsers}
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t.users.editUser : t.users.newUser}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>{t.users.userName}</Label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t.users.userName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.users.userEmail}</Label>
              <Input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder={t.users.userEmail}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.users.userRole}</Label>
              <Select
                value={userRole}
                onValueChange={(val) => setUserRole(val as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["owner", "admin", "manager", "user", "reader"] as Role[]
                  ).map((role) => (
                    <SelectItem key={role} value={role}>
                      {t.users.roles[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t.common.loading : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.users.deleteUser}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.categories.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteConfirm!)}
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
