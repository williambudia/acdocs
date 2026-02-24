export type Role = "owner" | "admin" | "manager" | "user" | "reader";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  groupIds: string[];
  createdAt: string;
  // Notification settings
  phone?: string; // Número do WhatsApp
  notificationPreferences?: {
    email: boolean;
    whatsapp: boolean;
    browser: boolean;
    alertDaysBefore: number[]; // Ex: [7, 15, 30] - alertar nesses dias
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  categoryIds: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  documentTypes: DocumentType[];
  sharedWithGroupIds: string[];
  createdAt: string;
}

export interface DocumentType {
  id: string;
  name: string;
  categoryId: string;
}

export interface Document {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  categoryId: string;
  documentTypeId: string;
  uploadedById: string;
  currentVersion: number;
  versions: DocumentVersion[];
  expiresAt?: string; // Data de expiração (opcional)
  alertDaysBefore?: number; // Dias antes para alertar (padrão: 30)
  createdAt: string;
  updatedAt: string;
}

// Helper para calcular status de expiração
export type ExpirationStatus = "expired" | "critical" | "warning" | "normal" | "none";

export function getExpirationStatus(expiresAt?: string): ExpirationStatus {
  if (!expiresAt) return "none";
  
  const now = new Date();
  const expirationDate = new Date(expiresAt);
  const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) return "expired";
  if (daysUntilExpiration <= 7) return "critical";
  if (daysUntilExpiration <= 30) return "warning";
  return "normal";
}

export function getDaysUntilExpiration(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  
  const now = new Date();
  const expirationDate = new Date(expiresAt);
  return Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileSize: number;
  uploadedById: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  documentId: string;
  documentName: string;
  type: "email" | "whatsapp" | "browser";
  status: "sent" | "failed" | "pending";
  message: string;
  sentAt: string;
  expiresAt?: string; // Data de expiração do documento
  daysUntilExpiration?: number;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  userName: string;
  resourceType: "document" | "category" | "group" | "user" | "auth";
  resourceId: string;
  resourceName: string;
  details?: string;
  createdAt: string;
}

export type AuditAction =
  | "upload"
  | "download"
  | "view"
  | "delete"
  | "create"
  | "update"
  | "login"
  | "logout";

// Permission matrix
export const PERMISSIONS: Record<Role, string[]> = {
  owner: ["*"], // Acesso total
  admin: [
    "categories:create",
    "categories:read",
    "categories:update",
    "categories:delete",
    "documents:create",
    "documents:read",
    "documents:update",
    "documents:delete",
    "groups:create",
    "groups:read",
    "groups:update",
    "groups:delete",
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "audit:read",
  ],
  manager: [
    "categories:create", // Manager pode criar categorias para organizar
    "categories:read",
    "categories:update",
    "documents:create",
    "documents:read",
    "documents:update",
    "documents:delete", // Manager pode deletar documentos do time
    "groups:read",
    "groups:update", // Manager pode gerenciar seus grupos
    "audit:read", // Manager pode ver auditoria do time
  ],
  user: [
    "documents:create",
    "documents:read",
    "documents:update:own", // Apenas seus próprios
    "documents:delete:own", // Apenas seus próprios
  ],
  reader: [
    "documents:read", // Apenas leitura
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  // Check wildcard permissions (e.g., "documents:*")
  const [resource] = permission.split(":");
  if (perms.includes(`${resource}:*`)) return true;
  return false;
}

// Helper para verificar se usuário pode acessar uma categoria
export function canAccessCategory(user: User, category: Category, groups: Group[]): boolean {
  // Owner e Admin podem acessar tudo
  if (user.role === "owner" || user.role === "admin") return true;
  
  // Verificar se a categoria está compartilhada com algum grupo do usuário
  const userGroupIds = user.groupIds;
  const categoryGroupIds = category.sharedWithGroupIds;
  
  return categoryGroupIds.some(groupId => userGroupIds.includes(groupId));
}

// Helper para verificar se usuário pode acessar um documento
export function canAccessDocument(
  user: User, 
  document: Document, 
  categories: Category[], 
  groups: Group[]
): boolean {
  // Owner e Admin podem acessar tudo
  if (user.role === "owner" || user.role === "admin") return true;
  
  // Usuário pode acessar seus próprios documentos
  if (document.uploadedById === user.id) return true;
  
  // Verificar se o documento pertence a uma categoria acessível
  const category = categories.find(c => c.id === document.categoryId);
  if (!category) return false;
  
  return canAccessCategory(user, category, groups);
}

// Helper para filtrar categorias acessíveis pelo usuário
export function getAccessibleCategories(user: User, categories: Category[], groups: Group[]): Category[] {
  if (user.role === "owner" || user.role === "admin") {
    return categories;
  }
  
  return categories.filter(category => canAccessCategory(user, category, groups));
}

// Helper para filtrar documentos acessíveis pelo usuário
export function getAccessibleDocuments(
  user: User, 
  documents: Document[], 
  categories: Category[], 
  groups: Group[]
): Document[] {
  if (user.role === "owner" || user.role === "admin") {
    return documents;
  }
  
  return documents.filter(document => canAccessDocument(user, document, categories, groups));
}

// Helper para filtrar grupos acessíveis pelo usuário
export function getAccessibleGroups(user: User, groups: Group[]): Group[] {
  if (user.role === "owner" || user.role === "admin") {
    return groups;
  }
  
  // Usuários podem ver apenas os grupos dos quais fazem parte
  return groups.filter(group => group.memberIds.includes(user.id));
}

// Helper para verificar se usuário pode editar/deletar documento
export function canModifyDocument(user: User, document: Document): boolean {
  // Owner e Admin podem modificar tudo
  if (user.role === "owner" || user.role === "admin") return true;
  
  // Manager pode modificar documentos das categorias do seu grupo
  if (user.role === "manager") return true;
  
  // User pode modificar apenas seus próprios documentos
  if (user.role === "user") return document.uploadedById === user.id;
  
  // Reader não pode modificar nada
  return false;
}
