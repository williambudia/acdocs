"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Category, Document, Group, User, AuditLog, DocumentType } from "./types";
import {
  mockCategories,
  mockDocuments,
  mockGroups,
  mockUsers,
  mockAuditLogs,
} from "./mock-data";

interface StoreContextType {
  // Categories
  categories: Category[];
  addCategory: (cat: Omit<Category, "id" | "createdAt" | "documentTypes">) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addDocumentType: (categoryId: string, name: string) => DocumentType;
  deleteDocumentType: (categoryId: string, typeId: string) => void;

  // Documents
  documents: Document[];
  addDocument: (doc: Omit<Document, "id" | "createdAt" | "updatedAt" | "versions" | "currentVersion">) => Document;
  deleteDocument: (id: string) => void;

  // Groups
  groups: Group[];
  addGroup: (group: Omit<Group, "id" | "createdAt">) => Group;
  updateGroup: (id: string, data: Partial<Group>) => void;
  deleteGroup: (id: string) => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, "id" | "createdAt">) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Audit
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, "id" | "createdAt">) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

let idCounter = 100;
function generateId(prefix: string) {
  idCounter++;
  return `${prefix}${idCounter}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);

  // Categories
  const addCategory = useCallback(
    (cat: Omit<Category, "id" | "createdAt" | "documentTypes">) => {
      const newCat: Category = {
        ...cat,
        id: generateId("c"),
        documentTypes: [],
        createdAt: new Date().toISOString(),
      };
      setCategories((prev) => [...prev, newCat]);
      return newCat;
    },
    []
  );

  const updateCategory = useCallback((id: string, data: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addDocumentType = useCallback((categoryId: string, name: string) => {
    const newType: DocumentType = {
      id: generateId("dt"),
      name,
      categoryId,
    };
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, documentTypes: [...c.documentTypes, newType] }
          : c
      )
    );
    return newType;
  }, []);

  const deleteDocumentType = useCallback(
    (categoryId: string, typeId: string) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                documentTypes: c.documentTypes.filter((dt) => dt.id !== typeId),
              }
            : c
        )
      );
    },
    []
  );

  // Documents
  const addDocument = useCallback(
    (
      doc: Omit<
        Document,
        "id" | "createdAt" | "updatedAt" | "versions" | "currentVersion"
      >
    ) => {
      const now = new Date().toISOString();
      const docId = generateId("d");
      const newDoc: Document = {
        ...doc,
        id: docId,
        currentVersion: 1,
        versions: [
          {
            id: generateId("v"),
            documentId: docId,
            version: 1,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            uploadedById: doc.uploadedById,
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      setDocuments((prev) => [...prev, newDoc]);
      return newDoc;
    },
    []
  );

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Groups
  const addGroup = useCallback((group: Omit<Group, "id" | "createdAt">) => {
    const newGroup: Group = {
      ...group,
      id: generateId("g"),
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  }, []);

  const updateGroup = useCallback((id: string, data: Partial<Group>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data } : g))
    );
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }, []);

  // Users
  const addUser = useCallback((user: Omit<User, "id" | "createdAt">) => {
    const newUser: User = {
      ...user,
      id: generateId("u"),
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  }, []);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...data } : u))
    );
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  // Audit
  const addAuditLog = useCallback(
    (log: Omit<AuditLog, "id" | "createdAt">) => {
      const newLog: AuditLog = {
        ...log,
        id: generateId("al"),
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    []
  );

  return (
    <StoreContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        addDocumentType,
        deleteDocumentType,
        documents,
        addDocument,
        deleteDocument,
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        users,
        addUser,
        updateUser,
        deleteUser,
        auditLogs,
        addAuditLog,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
