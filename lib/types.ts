export type Role = "owner" | "admin" | "manager" | "user" | "reader";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  groupIds: string[];
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  owner: ["*"],
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
    "users:read",
    "users:update",
    "audit:read",
  ],
  manager: [
    "categories:read",
    "documents:create",
    "documents:read",
    "documents:update",
    "groups:read",
    "groups:update",
    "users:read",
    "audit:read",
  ],
  user: [
    "categories:read",
    "documents:create",
    "documents:read",
    "documents:update:own",
    "documents:delete:own",
  ],
  reader: ["categories:read", "documents:read"],
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
