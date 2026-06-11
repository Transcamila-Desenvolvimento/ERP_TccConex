import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { BillingRecord } from '../types/domain';

export const BILLING_KEY = ['financeiro', 'billing'] as const;

export function useBillingRecords() {
  return useQuery({
    queryKey: BILLING_KEY,
    queryFn: () => apiService.getBillingRecords(),
  });
}

export function useImportBillingXml() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => apiService.importBillingXml(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BILLING_KEY }),
  });
}

export function useUpdateBillingRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Omit<BillingRecord, 'id'>> }) =>
      apiService.updateBillingRecord(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BILLING_KEY }),
  });
}

export function useDeleteBillingRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deleteBillingRecord(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BILLING_KEY }),
  });
}
