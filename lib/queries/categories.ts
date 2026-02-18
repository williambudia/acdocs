import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getDocumentTypesByCategory,
  createDocumentType,
  deleteDocumentType
} from '@/lib/db/operations';
import type { Category, DocumentType } from '@/lib/types';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  documentTypes: (categoryId: string) => [...categoryKeys.all, 'documentTypes', categoryId] as const,
};

// Queries
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: getAllCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDocumentTypes(categoryId: string) {
  return useQuery({
    queryKey: categoryKeys.documentTypes(categoryId),
    queryFn: () => getDocumentTypesByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations
export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryData: Omit<Category, 'id' | 'createdAt' | 'documentTypes'>) => 
      createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: Partial<Omit<Category, 'id' | 'createdAt' | 'documentTypes'>> 
    }) => updateCategory(id, updates),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.setQueryData(categoryKeys.detail(updatedCategory.id), updatedCategory);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: string; name: string }) => 
      createDocumentType(categoryId, name),
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.documentTypes(categoryId) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, docTypeId }: { categoryId: string; docTypeId: string }) => 
      deleteDocumentType(categoryId, docTypeId),
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.documentTypes(categoryId) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}