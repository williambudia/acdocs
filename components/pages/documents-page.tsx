"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  Eye,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { DocumentsSkeleton } from "@/components/skeletons";
import { useDocuments, useCreateDocument, useDeleteDocument } from "@/lib/queries/documents";
import { useCategories } from "@/lib/queries/categories";
import { useUsers } from "@/lib/queries/users";
import type { Document } from "@/lib/types";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function DocumentsPage() {
  const { t } = useI18n();
  const { user, can } = useAuth();
  
  // React Query hooks
  const { data: documents = [], isLoading } = useDocuments();
  const { data: categories = [] } = useCategories();
  const { data: users = [] } = useUsers();
  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showVersionsDialog, setShowVersionsDialog] = useState<Document | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Upload form
  const [uploadName, setUploadName] = useState("");
  const [uploadCategoryId, setUploadCategoryId] = useState("");
  const [uploadTypeId, setUploadTypeId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const canUpload = can("documents:create");
  const canDelete = can("documents:delete") || can("documents:delete:own");

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || doc.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCategory = categories.find((c) => c.id === uploadCategoryId);

  const handleUpload = async () => {
    if (!uploadName.trim() || !uploadCategoryId || !uploadTypeId || !user) return;
    setUploading(true);
    
    try {
      await createDocumentMutation.mutateAsync({
        name: uploadName.trim(),
        fileName: uploadFile?.name || `${uploadName.trim()}.pdf`,
        fileSize: uploadFile?.size || 100000,
        mimeType: uploadFile?.type || "application/pdf",
        categoryId: uploadCategoryId,
        documentTypeId: uploadTypeId,
        uploadedById: user.id,
        currentVersion: 1,
        versions: [{
          id: `v-${Date.now()}`,
          documentId: `doc-${Date.now()}`,
          version: 1,
          fileName: uploadFile?.name || `${uploadName.trim()}.pdf`,
          fileSize: uploadFile?.size || 100000,
          uploadedById: user.id,
          createdAt: new Date().toISOString(),
        }],
      });
      
      toast.success(t.toast.documentUploaded);
      resetUploadForm();
      setShowUploadDialog(false);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocumentMutation.mutateAsync(docId);
      toast.success(t.toast.documentDeleted);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    }
    setDeleteConfirm(null);
  };

  const resetUploadForm = () => {
    setUploadName("");
    setUploadCategoryId("");
    setUploadTypeId("");
    setUploadFile(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) return <DocumentsSkeleton />;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {documents.length} {t.documents.title.toLowerCase()}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.common.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t.documents.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t.categories.title}
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canUpload && (
            <Button
              onClick={() => setShowUploadDialog(true)}
              size="sm"
            >
              <Upload className="mr-1.5 size-4" />
              {t.documents.uploadFile}
            </Button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.documents.fileName}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t.documents.category}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t.documents.fileSize}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t.documents.version}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t.documents.uploadDate}
                  </TableHead>
                  <TableHead className="text-right">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const category = categories.find(
                    (c) => c.id === doc.categoryId
                  );
                  const uploader = users.find(
                    (u) => u.id === doc.uploadedById
                  );
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {category?.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{category?.name}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {formatBytes(doc.fileSize)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          v{doc.currentVersion}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {formatDate(doc.updatedAt)}
                        {uploader && (
                          <span className="block text-xs">
                            {uploader.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title={t.common.view}
                            onClick={() => setShowVersionsDialog(doc)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title={t.common.download}
                            onClick={() => {
                              toast.success(t.toast.documentDownloaded);
                            }}
                          >
                            <Download className="size-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive-foreground hover:text-destructive-foreground"
                              onClick={() => setDeleteConfirm(doc.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredDocuments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="size-8 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          {t.documents.noDocuments}
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

      {/* Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onOpenChange={(open) => {
          setShowUploadDialog(open);
          if (!open) resetUploadForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.documents.uploadFile}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>{t.common.name}</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder={t.documents.fileName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.documents.category}</Label>
              <Select
                value={uploadCategoryId}
                onValueChange={(val) => {
                  setUploadCategoryId(val);
                  setUploadTypeId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.documents.category} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCategory && selectedCategory.documentTypes.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>{t.common.type}</Label>
                <Select value={uploadTypeId} onValueChange={setUploadTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.common.type} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory.documentTypes.map((dt) => (
                      <SelectItem key={dt.id} value={dt.id}>
                        {dt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>{t.documents.uploadFile}</Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
              >
                {uploadFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{uploadFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadFile(null);
                      }}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground text-center">
                      {t.documents.dragDrop}
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      if (!uploadName) setUploadName(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={uploading}
              onClick={() => {
                setShowUploadDialog(false);
                resetUploadForm();
              }}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  {t.common.loading}
                </span>
              ) : (
                t.common.upload
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Versions Dialog */}
      <Dialog
        open={!!showVersionsDialog}
        onOpenChange={() => setShowVersionsDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showVersionsDialog?.name} - {t.documents.versions}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {showVersionsDialog?.versions
              .slice()
              .sort((a, b) => b.version - a.version)
              .map((version) => {
                const uploader = users.find(
                  (u) => u.id === version.uploadedById
                );
                return (
                  <div
                    key={version.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                      <Clock className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        v{version.version} - {version.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(version.fileSize)} &middot;{" "}
                        {uploader?.name} &middot; {formatDate(version.createdAt)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="size-7">
                      <Download className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.documents.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
