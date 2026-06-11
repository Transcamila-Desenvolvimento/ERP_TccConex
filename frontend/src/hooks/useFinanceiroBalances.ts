import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { BankAccount, BalanceHistoryEntry } from '../types/domain';

export const BANK_ACCOUNTS_KEY = ['financeiro', 'bankAccounts'] as const;
export const BALANCE_HISTORY_KEY = ['financeiro', 'balanceHistory'] as const;

export function useBankAccounts() {
  return useQuery({
    queryKey: BANK_ACCOUNTS_KEY,
    queryFn: () => apiService.getBankAccounts(),
  });
}

export function useBalanceHistory() {
  return useQuery({
    queryKey: BALANCE_HISTORY_KEY,
    queryFn: () => apiService.getBalanceHistory(),
  });
}

export function useSyncBankData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accounts, history }: { accounts: BankAccount[]; history: BalanceHistoryEntry[] }) =>
      apiService.syncBankData(accounts, history),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: BALANCE_HISTORY_KEY });
    },
  });
}
