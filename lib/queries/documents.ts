import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllDocuments, 
  getDocumentById, 
  getDocumentsByCategory,
  createDocument, 
  updateDocument, 
  deleteDocument 
} from '@/lib/db/operations';
import type { Document } from '@/lib/types';

// Query keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...documentKeys.lists(), { filters }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  byCategory: (categoryId: string) => [...documentKeys.all, 'byCategory', categoryId] as const,
};

// Queries
export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.lists(),
    queryFn: getAllDocuments,
    staleTime: 2 * 60 * 1000, // 2 minutes (documents change more frequently)
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => getDocumentById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDocumentsByCategory(categoryId: string) {
  return useQuery({
    queryKey: documentKeys.byCategory(categoryId),
    queryFn: () => getDocumentsByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000,
  });
}

// Mutations
export function useCreateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => 
      createDocument(documentData),
    onSuccess: (newDocument) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.byCategory(newDocument.categoryId) });
      // Also invalidate audit logs since upload creates an audit entry
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: Partial<Omit<Document, 'id' | 'createdAt'>> 
    }) => updateDocument(id, updates),
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.setQueryData(documentKeys.detail(updatedDocument.id), updatedDocument);
      queryClient.invalidateQueries({ queryKey: documentKeys.byCategory(updatedDocument.categoryId) });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });
}