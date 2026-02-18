import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllGroups, 
  getGroupById, 
  createGroup, 
  updateGroup, 
  deleteGroup 
} from '@/lib/db/operations';
import type { Group } from '@/lib/types';

// Query keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...groupKeys.lists(), { filters }] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
};

// Queries
export function useGroups() {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: getAllGroups,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => getGroupById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations
export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (groupData: Omit<Group, 'id' | 'createdAt'>) => createGroup(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Group, 'id' | 'createdAt'>> }) => 
      updateGroup(id, updates),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.setQueryData(groupKeys.detail(updatedGroup.id), updatedGroup);
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}