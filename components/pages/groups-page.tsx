"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { GroupsSkeleton } from "@/components/skeletons";
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from "@/lib/queries/groups";
import { useUsers } from "@/lib/queries/users";
import { useCategories } from "@/lib/queries/categories";
import type { Group } from "@/lib/types";

export function GroupsPage() {
  const { t } = useI18n();
  const { can } = useAuth();
  
  // React Query hooks
  const { data: groups = [], isLoading } = useGroups();
  const { data: users = [] } = useUsers();
  const { data: categories = [] } = useCategories();
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();

  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canCreate = can("groups:create");
  const canEdit = can("groups:update");
  const canDelete = can("groups:delete");

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupDesc("");
    setSelectedMembers([]);
    setSelectedCategories([]);
    setShowDialog(true);
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDesc(group.description);
    setSelectedMembers(group.memberIds);
    setSelectedCategories(group.categoryIds);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!groupName.trim()) return;
    setSaving(true);
    
    try {
      if (editingGroup) {
        await updateGroupMutation.mutateAsync({
          id: editingGroup.id,
          updates: {
            name: groupName.trim(),
            description: groupDesc.trim(),
            memberIds: selectedMembers,
            categoryIds: selectedCategories,
          }
        });
        toast.success(t.toast.groupUpdated);
      } else {
        await createGroupMutation.mutateAsync({
          name: groupName.trim(),
          description: groupDesc.trim(),
          memberIds: selectedMembers,
          categoryIds: selectedCategories,
        });
        toast.success(t.toast.groupCreated);
      }
      setShowDialog(false);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupMutation.mutateAsync(groupId);
      toast.success(t.toast.groupDeleted);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    }
    setDeleteConfirm(null);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  if (isLoading) return <GroupsSkeleton />;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {groups.length} {t.groups.title.toLowerCase()}
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
              {t.groups.newGroup}
            </Button>
          )}
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredGroups.map((group) => {
          const members = users.filter((u) => group.memberIds.includes(u.id));
          const cats = categories.filter((c) =>
            group.categoryIds.includes(c.id)
          );
          return (
            <Card key={group.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <UsersRound className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">
                      {group.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground truncate">
                      {group.description}
                    </p>
                  </div>
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex shrink-0 items-center gap-1">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => openEditDialog(group)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive-foreground hover:text-destructive-foreground"
                        onClick={() => setDeleteConfirm(group.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                {/* Members */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    {t.groups.members} ({members.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1"
                      >
                        <div className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                          {member.name.charAt(0)}
                        </div>
                        <span className="text-xs text-foreground">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared Categories */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    {t.groups.sharedCategories} ({cats.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cats.map((cat) => (
                      <Badge key={cat.id} variant="secondary" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UsersRound className="size-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">{t.groups.noGroups}</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? t.groups.editGroup : t.groups.newGroup}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>{t.groups.groupName}</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t.groups.groupName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.common.description}</Label>
              <Textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder={t.common.description}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.groups.members}</Label>
              <div className="flex flex-col gap-1.5 rounded-lg border p-3 max-h-40 overflow-y-auto">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMembers.includes(u.id)}
                      onCheckedChange={() => toggleMember(u.id)}
                    />
                    <span className="text-sm text-foreground">{u.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {t.users.roles[u.role]}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.groups.sharedCategories}</Label>
              <div className="flex flex-col gap-1.5 rounded-lg border p-3 max-h-40 overflow-y-auto">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <span className="text-sm text-foreground">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  {t.common.loading}
                </span>
              ) : (
                t.common.save
              )}
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
            <AlertDialogTitle>{t.groups.deleteGroup}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.categories.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  handleDeleteGroup(deleteConfirm);
                }
                setDeleteConfirm(null);
              }}
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
