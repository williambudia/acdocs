import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  authenticateUser,
  logoutUser
} from '@/lib/db/operations';
import type { User, Role } from '@/lib/types';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Queries
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getAllUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Omit<User, 'id' | 'createdAt'>) => createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<User, 'id' | 'createdAt'>> }) => 
      updateUser(id, updates),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useAuthenticateUser() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      authenticateUser(email, password),
  });
}

export function useLogoutUser() {
  return useMutation({
    mutationFn: ({ userId, userName }: { userId: string; userName: string }) => 
      logoutUser(userId, userName),
  });
}