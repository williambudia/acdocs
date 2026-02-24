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
  Filter,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { useGroups } from "@/lib/queries/groups";
import type { Document } from "@/lib/types";
import { 
  getExpirationStatus, 
  getDaysUntilExpiration,
  getAccessibleCategories,
  getAccessibleDocuments,
  canModifyDocument,
} from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getExpirationBadge(doc: Document, t: any) {
  if (!doc.expiresAt) return null;
  
  const status = getExpirationStatus(doc.expiresAt);
  const days = getDaysUntilExpiration(doc.expiresAt);
  
  const variants = {
    expired: "destructive",
    critical: "destructive",
    warning: "default",
    normal: "secondary",
    none: "secondary",
  } as const;
  
  const icons = {
    expired: <AlertTriangle className="size-3" />,
    critical: <AlertTriangle className="size-3" />,
    warning: <Clock className="size-3" />,
    normal: <Clock className="size-3" />,
    none: null,
  };
  
  if (status === "expired") {
    return (
      <Badge variant={variants[status]} className="gap-1 text-xs">
        {icons[status]}
        {t.documents.expired}
      </Badge>
    );
  }
  
  if (days !== null) {
    return (
      <Badge variant={variants[status]} className="gap-1 text-xs">
        {icons[status]}
        {days === 0 ? t.documents.expiresToday : `${days} ${days === 1 ? t.documents.day : t.documents.days}`}
      </Badge>
    );
  }
  
  return null;
}

export function DocumentsPage() {
  const { t } = useI18n();
  const { user, can } = useAuth();
  
  // React Query hooks
  const { data: documents = [], isLoading } = useDocuments();
  const { data: categories = [] } = useCategories();
  const { data: users = [] } = useUsers();
  const { data: groups = [] } = useGroups();
  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  // Filtrar dados baseado em permissões de grupo
  const accessibleCategories = user ? getAccessibleCategories(user, categories, groups) : [];
  const accessibleDocuments = user ? getAccessibleDocuments(user, documents, categories, groups) : [];

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDocumentType, setFilterDocumentType] = useState<string>("all");
  const [filterUploadedBy, setFilterUploadedBy] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterExpirationStatus, setFilterExpirationStatus] = useState<string>("all");
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
  const [uploadHasExpiration, setUploadHasExpiration] = useState(false);
  const [uploadExpiresAt, setUploadExpiresAt] = useState("");
  const [uploadAlertDays, setUploadAlertDays] = useState("30");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const canUpload = can("documents:create");
  const canDelete = can("documents:delete") || can("documents:delete:own");

  // Filtros em cascata - documentos filtrados pela categoria selecionada
  const documentsFilteredByCategory = filterCategory === "all" 
    ? accessibleDocuments 
    : accessibleDocuments.filter(doc => doc.categoryId === filterCategory);

  // Tipos de documento disponíveis baseados na categoria selecionada
  const availableDocumentTypes = filterCategory === "all"
    ? accessibleCategories.flatMap(cat => cat.documentTypes)
    : accessibleCategories
        .filter(cat => cat.id === filterCategory)
        .flatMap(cat => cat.documentTypes);

  // Documentos filtrados por categoria E tipo
  const documentsFilteredByCategoryAndType = filterDocumentType === "all"
    ? documentsFilteredByCategory
    : documentsFilteredByCategory.filter(doc => doc.documentTypeId === filterDocumentType);

  // Usuários que fizeram upload baseado em categoria E tipo selecionados
  const availableUploaders = Array.from(
    new Set(documentsFilteredByCategoryAndType.map(doc => doc.uploadedById))
  )
    .map(userId => users.find(u => u.id === userId))
    .filter((u): u is typeof users[0] => u !== undefined);

  const filteredDocuments = accessibleDocuments.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(search.toLowerCase()) ||
      doc.fileName
        .toLowerCase()
        .includes(search.toLowerCase());
    
    const matchesCategory =
      filterCategory === "all" || doc.categoryId === filterCategory;
    
    const matchesDocumentType =
      filterDocumentType === "all" || doc.documentTypeId === filterDocumentType;
    
    const matchesUploadedBy =
      filterUploadedBy === "all" || doc.uploadedById === filterUploadedBy;
    
    const matchesDateRange = (() => {
      if (!filterDateFrom && !filterDateTo) return true;
      
      const docDate = new Date(doc.createdAt);
      const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
      const toDate = filterDateTo ? new Date(filterDateTo + "T23:59:59") : null;
      
      if (fromDate && docDate < fromDate) return false;
      if (toDate && docDate > toDate) return false;
      
      return true;
    })();
    
    const matchesExpirationStatus = (() => {
      if (filterExpirationStatus === "all") return true;
      const status = getExpirationStatus(doc.expiresAt);
      return status === filterExpirationStatus;
    })();
    
    return matchesSearch && matchesCategory && matchesDocumentType && matchesUploadedBy && matchesDateRange && matchesExpirationStatus;
  });

  const selectedCategory = accessibleCategories.find((c) => c.id === uploadCategoryId);

  // Resetar filtros dependentes quando categoria ou tipo mudar
  useEffect(() => {
    // Se mudou a categoria
    if (filterCategory !== "all") {
      // Verificar se o tipo de documento selecionado pertence à categoria
      const typeExists = availableDocumentTypes.some(t => t.id === filterDocumentType);
      if (!typeExists && filterDocumentType !== "all") {
        setFilterDocumentType("all");
      }
    }

    // Se mudou o tipo de documento ou categoria
    if (filterCategory !== "all" || filterDocumentType !== "all") {
      // Verificar se o usuário selecionado tem documentos com esse filtro
      const userExists = availableUploaders.some(u => u.id === filterUploadedBy);
      if (!userExists && filterUploadedBy !== "all") {
        setFilterUploadedBy("all");
      }
    }
  }, [filterCategory, filterDocumentType, availableDocumentTypes, availableUploaders, filterUploadedBy]);

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
        expiresAt: uploadHasExpiration && uploadExpiresAt ? uploadExpiresAt : undefined,
        alertDaysBefore: uploadHasExpiration && uploadAlertDays ? parseInt(uploadAlertDays) : undefined,
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
    setUploadHasExpiration(false);
    setUploadExpiresAt("");
    setUploadAlertDays("30");
  };

  const clearAllFilters = () => {
    setSearch("");
    setFilterCategory("all");
    setFilterDocumentType("all");
    setFilterUploadedBy("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterExpirationStatus("all");
  };

  const hasActiveFilters = search || filterCategory !== "all" || filterDocumentType !== "all" || 
    filterUploadedBy !== "all" || filterDateFrom || filterDateTo || filterExpirationStatus !== "all";

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
      <div className="flex flex-col gap-4">
        {/* Header com contador, busca rápida e botão de upload */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredDocuments.length} de {accessibleDocuments.length} {t.documents.title.toLowerCase()}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <X className="mr-1 size-3" />
                Limpar filtros
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Busca Rápida */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Busca rápida..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {canUpload && (
              <Button onClick={() => setShowUploadDialog(true)} size="sm">
                <Upload className="mr-1.5 size-4" />
                {t.documents.uploadFile}
              </Button>
            )}
          </div>
        </div>

        {/* Filtros Avançados em Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters" className="border rounded-lg !border-b">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Filter className="size-4" />
                <span className="font-medium">Filtros Avançados</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {[
                      filterCategory !== "all" && "Categoria",
                      filterDocumentType !== "all" && "Tipo", 
                      filterUploadedBy !== "all" && "Usuário",
                      filterExpirationStatus !== "all" && "Validade",
                      (filterDateFrom || filterDateTo) && "Data"
                    ].filter(Boolean).length} ativo(s)
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Filtro por Categoria */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categoria</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {accessibleCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filterCategory !== "all" && (
                    <p className="text-xs text-muted-foreground">
                      Filtros ajustados para esta categoria
                    </p>
                  )}
                </div>

                {/* Filtro por Tipo de Documento */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Tipo de Documento
                    {filterCategory !== "all" && availableDocumentTypes.length > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({availableDocumentTypes.length})
                      </span>
                    )}
                  </Label>
                  <Select 
                    value={filterDocumentType} 
                    onValueChange={setFilterDocumentType}
                    disabled={filterCategory === "all" || availableDocumentTypes.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        filterCategory === "all" 
                          ? "Selecione uma categoria primeiro" 
                          : "Todos os tipos"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {availableDocumentTypes
                        .filter((type, index, self) => 
                          self.findIndex(t => t.id === type.id) === index
                        )
                        .map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {filterCategory === "all" && (
                    <p className="text-xs text-muted-foreground">
                      Selecione uma categoria para filtrar por tipo
                    </p>
                  )}
                </div>

                {/* Filtro por Usuário */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Enviado por
                    {(filterCategory !== "all" || filterDocumentType !== "all") && availableUploaders.length > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({availableUploaders.length})
                      </span>
                    )}
                  </Label>
                  <Select 
                    value={filterUploadedBy} 
                    onValueChange={setFilterUploadedBy}
                    disabled={filterCategory === "all" && filterDocumentType === "all"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        filterCategory === "all" && filterDocumentType === "all"
                          ? "Selecione categoria ou tipo primeiro"
                          : "Todos os usuários"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {availableUploaders.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filterCategory === "all" && filterDocumentType === "all" && (
                    <p className="text-xs text-muted-foreground">
                      Selecione categoria ou tipo para filtrar por usuário
                    </p>
                  )}
                </div>

                {/* Filtro por Status de Validade */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status de Validade</Label>
                  <Select value={filterExpirationStatus} onValueChange={setFilterExpirationStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="expired">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="size-3 text-destructive" />
                          Vencidos
                        </div>
                      </SelectItem>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="size-3 text-orange-500" />
                          Críticos (≤7 dias)
                        </div>
                      </SelectItem>
                      <SelectItem value="warning">
                        <div className="flex items-center gap-2">
                          <Clock className="size-3 text-yellow-600" />
                          Atenção (≤30 dias)
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">Normal (&gt;30 dias)</SelectItem>
                      <SelectItem value="none">Sem validade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Período - Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Período</Label>
                    <div className="flex gap-1">
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent text-xs px-2 py-0.5"
                        onClick={() => {
                          const today = new Date();
                          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                          setFilterDateFrom(lastWeek.toISOString().split('T')[0]);
                          setFilterDateTo(today.toISOString().split('T')[0]);
                        }}
                      >
                        7d
                      </Badge>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent text-xs px-2 py-0.5"
                        onClick={() => {
                          const today = new Date();
                          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                          setFilterDateFrom(lastMonth.toISOString().split('T')[0]);
                          setFilterDateTo(today.toISOString().split('T')[0]);
                        }}
                      >
                        30d
                      </Badge>
                      {(filterDateFrom || filterDateTo) && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80 text-xs px-2 py-0.5"
                          onClick={() => {
                            setFilterDateFrom("");
                            setFilterDateTo("");
                          }}
                        >
                          <X className="size-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="date"
                        placeholder="Data inicial"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Input
                        type="date"
                        placeholder="Data final"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações dos Filtros */}
              {hasActiveFilters && (
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    <X className="mr-1 size-3" />
                    Limpar todos os filtros
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
                  <TableHead className="hidden lg:table-cell">
                    Validade
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
                      <TableCell className="hidden lg:table-cell">
                        {getExpirationBadge(doc, t) || (
                          <span className="text-xs text-muted-foreground">{t.documents.noExpiration}</span>
                        )}
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
                          {canDelete && user && canModifyDocument(user, doc) && (
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
                    <TableCell colSpan={7} className="h-32 text-center">
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
                  {accessibleCategories.map((cat) => (
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
            
            {/* Expiration Section */}
            <div className="flex flex-col gap-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasExpiration"
                  checked={uploadHasExpiration}
                  onCheckedChange={(checked) => setUploadHasExpiration(checked === true)}
                />
                <Label htmlFor="hasExpiration" className="text-sm font-normal cursor-pointer">
                  {t.documents.hasExpiration}
                </Label>
              </div>
              
              {uploadHasExpiration && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">{t.documents.expiresAt}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        value={uploadExpiresAt}
                        onChange={(e) => setUploadExpiresAt(e.target.value)}
                        className="pl-10"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">Alertar com</Label>
                    <Select value={uploadAlertDays} onValueChange={setUploadAlertDays}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias antes</SelectItem>
                        <SelectItem value="15">15 dias antes</SelectItem>
                        <SelectItem value="30">30 dias antes</SelectItem>
                        <SelectItem value="60">60 dias antes</SelectItem>
                        <SelectItem value="90">90 dias antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            
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
