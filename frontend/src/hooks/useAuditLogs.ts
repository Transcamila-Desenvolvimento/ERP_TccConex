import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/apiService';

export const AUDIT_LOGS_QUERY_KEY = ['auditLogs'] as const;

export function useAuditLogs() {
  return useQuery({
    queryKey: AUDIT_LOGS_QUERY_KEY,
    queryFn: () => apiService.getAuditLogs(),
  });
}
