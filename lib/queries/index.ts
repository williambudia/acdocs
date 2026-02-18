// Export all query hooks for easy importing
export * from './users';
export * from './groups';
export * from './categories';
export * from './documents';
export * from './audit';

// Query key factories for easy cache invalidation
export const queryKeys = {
  users: ['users'],
  groups: ['groups'],
  categories: ['categories'],
  documents: ['documents'],
  auditLogs: ['auditLogs'],
} as const;

// Utility function to invalidate all related queries
export function invalidateAllQueries(queryClient: any) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.users }),
    queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    queryClient.invalidateQueries({ queryKey: queryKeys.documents }),
    queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
  ]);
}