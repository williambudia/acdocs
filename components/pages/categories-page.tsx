"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Plus,
  FileText,
  MoreHorizontal,
  User,
  Receipt,
  Building,
  Landmark,
  Leaf,
  Trees,
  GripVertical,
  Search,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { CategoriesSkeleton } from "@/components/skeletons";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateDocumentType, useDeleteDocumentType } from "@/lib/queries/categories";
import { useGroups } from "@/lib/queries/groups";
import type { Category } from "@/lib/types";
import { getAccessibleCategories } from "@/lib/types";

const iconMap: Record<string, React.ElementType> = {
  User,
  Receipt,
  Building,
  Landmark,
  Leaf,
  Trees,
  FileText,
};

const iconOptions = [
  { value: "User", label: "User" },
  { value: "Receipt", label: "Receipt" },
  { value: "Building", label: "Building" },
  { value: "Landmark", label: "Landmark" },
  { value: "Leaf", label: "Leaf" },
  { value: "Trees", label: "Trees" },
  { value: "FileText", label: "FileText" },
];

export function CategoriesPage() {
  const { t } = useI18n();
  const { user, can } = useAuth();
  
  // React Query hooks
  const { data: categories = [], isLoading } = useCategories();
  const { data: groups = [] } = useGroups();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const createDocumentTypeMutation = useCreateDocumentType();
  const deleteDocumentTypeMutation = useDeleteDocumentType();

  const [search, setSearch] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("FileText");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newTypeInput, setNewTypeInput] = useState<Record<string, string>>({});
  const [addingTypeFor, setAddingTypeFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canEdit = can("categories:update") || can("categories:create");
  const canDelete = can("categories:delete");

  // Filtrar categorias acessíveis baseado em grupos
  const accessibleCategories = user ? getAccessibleCategories(user, categories, groups) : [];

  const filteredCategories = accessibleCategories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryIcon("FileText");
    setShowCategoryDialog(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryIcon(cat.icon);
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    setSaving(true);
    
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          updates: {
            name: categoryName.trim(),
            icon: categoryIcon,
          }
        });
        toast.success(t.toast.categoryUpdated);
      } else {
        await createCategoryMutation.mutateAsync({
          name: categoryName.trim(),
          icon: categoryIcon,
          parentId: null,
          sharedWithGroupIds: [],
        });
        toast.success(t.toast.categoryCreated);
      }
      setShowCategoryDialog(false);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const handleAddType = async (categoryId: string) => {
    const name = newTypeInput[categoryId]?.trim();
    if (!name) return;
    
    try {
      await createDocumentTypeMutation.mutateAsync({ categoryId, name });
      toast.success(t.toast.typeAdded);
      setNewTypeInput((prev) => ({ ...prev, [categoryId]: "" }));
      setAddingTypeFor(null);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    }
  };

  const handleDeleteType = async (categoryId: string, docTypeId: string) => {
    try {
      await deleteDocumentTypeMutation.mutateAsync({ categoryId, docTypeId });
      toast.success(t.toast.typeDeleted);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
      toast.success(t.toast.categoryDeleted);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    }
    setDeleteConfirm(null);
  };

  const handleCancelAddType = (categoryId: string) => {
    setNewTypeInput((prev) => ({ ...prev, [categoryId]: "" }));
    setAddingTypeFor(null);
  };

  if (isLoading) return <CategoriesSkeleton />;

  return (
    <div className="flex min-w-0 flex-col gap-2 p-4 md:py-2 md:px-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {categories.length} {t.categories.title.toLowerCase()}
        </p>
        <div className="relative flex-1 sm:max-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-10 text-sm"
          />
        </div>
        {canEdit && (
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="mr-1.5 size-4" />
            {t.categories.newCategory}
          </Button>
        )}
      </div>

      {/* Category Cards Grid */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredCategories.map((category) => {
          const IconComp = iconMap[category.icon] || FileText;
          return (
            <Card key={category.id} className="flex min-w-0 flex-col overflow-hidden !gap-2 !py-2">
              {/* Card Header - px-4 py-3 */}
              <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <IconComp className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {category.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {category.documentTypes.length} {t.categories.types}
                    </p>
                  </div>
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive-foreground hover:text-destructive-foreground"
                        onClick={() => setDeleteConfirm(category.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>

              {/* Document Types List - px-4, items px-2 py-1.5 */}
              <CardContent className="flex-1 px-4 !py-0">
                <div className="flex flex-col">
                  {category.documentTypes.map((dt) => (
                    <div
                      key={dt.id}
                      className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40" />
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm text-foreground truncate">
                        {dt.name}
                      </span>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive-foreground"
                              onClick={() => handleDeleteType(category.id, dt.id)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              {t.common.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Footer - Add New Type - px-4 py-3 */}
              {canEdit && (
                <div className="mt-auto px-4 py-3">
                  {addingTypeFor === category.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        autoFocus
                        placeholder={t.categories.newType}
                        value={newTypeInput[category.id] || ""}
                        onChange={(e) =>
                          setNewTypeInput((prev) => ({
                            ...prev,
                            [category.id]: e.target.value,
                          }))
                        }
                        className="h-7 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddType(category.id);
                          if (e.key === "Escape") handleCancelAddType(category.id);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950"
                        onClick={() => handleAddType(category.id)}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                        onClick={() => handleCancelAddType(category.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTypeFor(category.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <Plus className="size-3.5" />
                      <span>{t.categories.newType}</span>
                    </button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderTreeIcon className="size-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">{t.categories.noCategories}</p>
        </div>
      )}

      {/* Category Create/Edit Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? t.categories.editCategory
                : t.categories.newCategory}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>{t.categories.categoryName}</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t.categories.categoryName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveCategory();
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.categories.icon}</Label>
              <Select value={categoryIcon} onValueChange={setCategoryIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => {
                    const Icon = iconMap[opt.value];
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)} disabled={saving}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
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
            <AlertDialogTitle>{t.categories.deleteCategory}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.categories.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  handleDeleteCategory(deleteConfirm);
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

function FolderTreeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M13 10h7a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15.2 3H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />
      <path d="M13 21h7a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2a1 1 0 0 0-.8-.4H13a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1Z" />
      <path d="M3 3v2" />
      <path d="M3 7v8" />
      <path d="M3 17v2" />
      <path d="M7 5h5" />
      <path d="M7 16h5" />
      <path d="M3 5h4" />
      <path d="M3 16h4" />
    </svg>
  );
}
