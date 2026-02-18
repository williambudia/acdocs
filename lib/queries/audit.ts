import { useQuery } from '@tanstack/react-query';
import { getAllAuditLogs } from '@/lib/db/operations';

// Query keys
export const auditKeys = {
  all: ['auditLogs'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...auditKeys.lists(), { filters }] as const,
};

// Queries
export function useAuditLogs() {
  return useQuery({
    queryKey: auditKeys.lists(),
    queryFn: getAllAuditLogs,
    staleTime: 1 * 60 * 1000, // 1 minute (audit logs are frequently updated)
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
}