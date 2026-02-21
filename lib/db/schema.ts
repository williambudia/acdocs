import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { User, Group, Category, Document, AuditLog, DocumentType } from '@/lib/types';

export interface ACDocsDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: {
      'by-email': string;
      'by-role': string;
    };
  };
  groups: {
    key: string;
    value: Group;
    indexes: {
      'by-name': string;
    };
  };
  categories: {
    key: string;
    value: Category;
    indexes: {
      'by-name': string;
      'by-parent': string | null;
    };
  };
  documents: {
    key: string;
    value: Document;
    indexes: {
      'by-category': string;
      'by-uploader': string;
      'by-name': string;
    };
  };
  documentTypes: {
    key: string;
    value: DocumentType;
    indexes: {
      'by-category': string;
    };
  };
  auditLogs: {
    key: string;
    value: AuditLog;
    indexes: {
      'by-user': string;
      'by-resource': string;
      'by-action': string;
      'by-date': string;
    };
  };
}

let dbInstance: IDBPDatabase<ACDocsDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<ACDocsDB>> {
  if (dbInstance) return dbInstance;

  // Clean up old database if it exists
  try {
    const databases = await indexedDB.databases();
    const oldDb = databases.find(db => db.name === 'docmanager-db');
    if (oldDb) {
      indexedDB.deleteDatabase('docmanager-db');
    }
  } catch (e) {
    // Ignore errors - some browsers don't support databases()
  }

  dbInstance = await openDB<ACDocsDB>('acdocs-db', 1, {
    upgrade(db) {
      // Users store
      const userStore = db.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('by-email', 'email', { unique: true });
      userStore.createIndex('by-role', 'role');

      // Groups store
      const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
      groupStore.createIndex('by-name', 'name');

      // Categories store
      const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
      categoryStore.createIndex('by-name', 'name');
      categoryStore.createIndex('by-parent', 'parentId');

      // Documents store
      const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
      documentStore.createIndex('by-category', 'categoryId');
      documentStore.createIndex('by-uploader', 'uploadedById');
      documentStore.createIndex('by-name', 'name');

      // Document Types store
      const documentTypeStore = db.createObjectStore('documentTypes', { keyPath: 'id' });
      documentTypeStore.createIndex('by-category', 'categoryId');

      // Audit Logs store
      const auditStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
      auditStore.createIndex('by-user', 'userId');
      auditStore.createIndex('by-resource', 'resourceId');
      auditStore.createIndex('by-action', 'action');
      auditStore.createIndex('by-date', 'createdAt');
    },
  });

  return dbInstance;
}

export async function getDB(): Promise<IDBPDatabase<ACDocsDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}