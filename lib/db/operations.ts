import { getDB } from './schema';
import type { User, Group, Category, Document, AuditLog, DocumentType, Role } from '@/lib/types';
import { mockUsers, mockGroups, mockCategories, mockDocuments, mockAuditLogs } from '@/lib/mock-data';

// Utility function to generate IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize database with mock data
export async function seedDatabase(): Promise<void> {
  const db = await getDB();
  
  // Check if data already exists
  const userCount = await db.count('users');
  if (userCount > 0) return; // Already seeded

  const tx = db.transaction(['users', 'groups', 'categories', 'documents', 'documentTypes', 'auditLogs'], 'readwrite');

  // Seed users
  for (const user of mockUsers) {
    await tx.objectStore('users').add(user);
  }

  // Seed groups
  for (const group of mockGroups) {
    await tx.objectStore('groups').add(group);
  }

  // Seed categories and document types
  for (const category of mockCategories) {
    await tx.objectStore('categories').add(category);
    
    // Add document types for this category
    for (const docType of category.documentTypes) {
      await tx.objectStore('documentTypes').add(docType);
    }
  }

  // Seed documents
  for (const document of mockDocuments) {
    await tx.objectStore('documents').add(document);
  }

  // Seed audit logs
  for (const log of mockAuditLogs) {
    await tx.objectStore('auditLogs').add(log);
  }

  await tx.done;
}

// User operations
export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  return await db.getAll('users');
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDB();
  return await db.get('users', id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDB();
  return await db.getFromIndex('users', 'by-email', email);
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const db = await getDB();
  const user: User = {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  await db.add('users', user);
  
  // Log audit
  await logAudit({
    action: 'create',
    userId: user.id,
    userName: user.name,
    resourceType: 'user',
    resourceId: user.id,
    resourceName: user.name,
  });
  
  return user;
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
  const db = await getDB();
  const existing = await db.get('users', id);
  if (!existing) throw new Error('User not found');
  
  const updated: User = { ...existing, ...updates };
  await db.put('users', updated);
  
  // Log audit
  await logAudit({
    action: 'update',
    userId: id,
    userName: updated.name,
    resourceType: 'user',
    resourceId: id,
    resourceName: updated.name,
  });
  
  return updated;
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDB();
  const user = await db.get('users', id);
  if (!user) throw new Error('User not found');
  
  await db.delete('users', id);
  
  // Log audit
  await logAudit({
    action: 'delete',
    userId: id,
    userName: user.name,
    resourceType: 'user',
    resourceId: id,
    resourceName: user.name,
  });
}

// Group operations
export async function getAllGroups(): Promise<Group[]> {
  const db = await getDB();
  return await db.getAll('groups');
}

export async function getGroupById(id: string): Promise<Group | undefined> {
  const db = await getDB();
  return await db.get('groups', id);
}

export async function createGroup(groupData: Omit<Group, 'id' | 'createdAt'>): Promise<Group> {
  const db = await getDB();
  const group: Group = {
    ...groupData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  await db.add('groups', group);
  
  // Log audit
  await logAudit({
    action: 'create',
    userId: 'system', // TODO: Get current user
    userName: 'System',
    resourceType: 'group',
    resourceId: group.id,
    resourceName: group.name,
  });
  
  return group;
}

export async function updateGroup(id: string, updates: Partial<Omit<Group, 'id' | 'createdAt'>>): Promise<Group> {
  const db = await getDB();
  const existing = await db.get('groups', id);
  if (!existing) throw new Error('Group not found');
  
  const updated: Group = { ...existing, ...updates };
  await db.put('groups', updated);
  
  // Log audit
  await logAudit({
    action: 'update',
    userId: 'system',
    userName: 'System',
    resourceType: 'group',
    resourceId: id,
    resourceName: updated.name,
  });
  
  return updated;
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await getDB();
  const group = await db.get('groups', id);
  if (!group) throw new Error('Group not found');
  
  await db.delete('groups', id);
  
  // Log audit
  await logAudit({
    action: 'delete',
    userId: 'system',
    userName: 'System',
    resourceType: 'group',
    resourceId: id,
    resourceName: group.name,
  });
}

// Category operations
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB();
  return await db.getAll('categories');
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const db = await getDB();
  return await db.get('categories', id);
}

export async function createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'documentTypes'>): Promise<Category> {
  const db = await getDB();
  const category: Category = {
    ...categoryData,
    id: generateId(),
    documentTypes: [],
    createdAt: new Date().toISOString(),
  };
  
  await db.add('categories', category);
  
  // Log audit
  await logAudit({
    action: 'create',
    userId: 'system',
    userName: 'System',
    resourceType: 'category',
    resourceId: category.id,
    resourceName: category.name,
  });
  
  return category;
}

export async function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'documentTypes'>>): Promise<Category> {
  const db = await getDB();
  const existing = await db.get('categories', id);
  if (!existing) throw new Error('Category not found');
  
  const updated: Category = { ...existing, ...updates };
  await db.put('categories', updated);
  
  // Log audit
  await logAudit({
    action: 'update',
    userId: 'system',
    userName: 'System',
    resourceType: 'category',
    resourceId: id,
    resourceName: updated.name,
  });
  
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB();
  const category = await db.get('categories', id);
  if (!category) throw new Error('Category not found');
  
  // Delete associated document types
  const docTypes = await db.getAllFromIndex('documentTypes', 'by-category', id);
  const tx = db.transaction(['categories', 'documentTypes'], 'readwrite');
  
  await tx.objectStore('categories').delete(id);
  
  for (const docType of docTypes) {
    await tx.objectStore('documentTypes').delete(docType.id);
  }
  
  await tx.done;
  
  // Log audit
  await logAudit({
    action: 'delete',
    userId: 'system',
    userName: 'System',
    resourceType: 'category',
    resourceId: id,
    resourceName: category.name,
  });
}

// Document Type operations
export async function getDocumentTypesByCategory(categoryId: string): Promise<DocumentType[]> {
  const db = await getDB();
  return await db.getAllFromIndex('documentTypes', 'by-category', categoryId);
}

export async function createDocumentType(categoryId: string, name: string): Promise<DocumentType> {
  const db = await getDB();
  const docType: DocumentType = {
    id: generateId(),
    name,
    categoryId,
  };
  
  await db.add('documentTypes', docType);
  
  // Update category to include this document type
  const category = await db.get('categories', categoryId);
  if (category) {
    category.documentTypes.push(docType);
    await db.put('categories', category);
  }
  
  return docType;
}

export async function deleteDocumentType(categoryId: string, docTypeId: string): Promise<void> {
  const db = await getDB();
  
  await db.delete('documentTypes', docTypeId);
  
  // Update category to remove this document type
  const category = await db.get('categories', categoryId);
  if (category) {
    category.documentTypes = category.documentTypes.filter(dt => dt.id !== docTypeId);
    await db.put('categories', category);
  }
}

// Document operations
export async function getAllDocuments(): Promise<Document[]> {
  const db = await getDB();
  return await db.getAll('documents');
}

export async function getDocumentById(id: string): Promise<Document | undefined> {
  const db = await getDB();
  return await db.get('documents', id);
}

export async function getDocumentsByCategory(categoryId: string): Promise<Document[]> {
  const db = await getDB();
  return await db.getAllFromIndex('documents', 'by-category', categoryId);
}

export async function createDocument(documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
  const db = await getDB();
  const document: Document = {
    ...documentData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await db.add('documents', document);
  
  // Log audit
  await logAudit({
    action: 'upload',
    userId: document.uploadedById,
    userName: 'User', // TODO: Get actual user name
    resourceType: 'document',
    resourceId: document.id,
    resourceName: document.name,
  });
  
  return document;
}

export async function updateDocument(id: string, updates: Partial<Omit<Document, 'id' | 'createdAt'>>): Promise<Document> {
  const db = await getDB();
  const existing = await db.get('documents', id);
  if (!existing) throw new Error('Document not found');
  
  const updated: Document = { 
    ...existing, 
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.put('documents', updated);
  
  // Log audit
  await logAudit({
    action: 'update',
    userId: updated.uploadedById,
    userName: 'User',
    resourceType: 'document',
    resourceId: id,
    resourceName: updated.name,
  });
  
  return updated;
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  const document = await db.get('documents', id);
  if (!document) throw new Error('Document not found');
  
  await db.delete('documents', id);
  
  // Log audit
  await logAudit({
    action: 'delete',
    userId: document.uploadedById,
    userName: 'User',
    resourceType: 'document',
    resourceId: id,
    resourceName: document.name,
  });
}

// Audit Log operations
export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const db = await getDB();
  const logs = await db.getAll('auditLogs');
  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function logAudit(auditData: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
  const db = await getDB();
  const log: AuditLog = {
    ...auditData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  await db.add('auditLogs', log);
  return log;
}

// Authentication operations
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // In a real app, you'd verify the password hash
  // For demo purposes, we'll just check if user exists and password is "demo"
  if (password !== 'demo') return null;
  
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  // Log login
  await logAudit({
    action: 'login',
    userId: user.id,
    userName: user.name,
    resourceType: 'auth',
    resourceId: user.id,
    resourceName: user.name,
  });
  
  return user;
}

export async function logoutUser(userId: string, userName: string): Promise<void> {
  await logAudit({
    action: 'logout',
    userId,
    userName,
    resourceType: 'auth',
    resourceId: userId,
    resourceName: userName,
  });
}

// Helper function to reset database (useful for development/debugging)
export async function resetDatabase(): Promise<void> {
  const db = await getDB();
  
  const tx = db.transaction(['users', 'groups', 'categories', 'documents', 'documentTypes', 'auditLogs'], 'readwrite');
  
  await tx.objectStore('users').clear();
  await tx.objectStore('groups').clear();
  await tx.objectStore('categories').clear();
  await tx.objectStore('documents').clear();
  await tx.objectStore('documentTypes').clear();
  await tx.objectStore('auditLogs').clear();
  
  await tx.done;
  
  // Re-seed the database
  await seedDatabase();
}
