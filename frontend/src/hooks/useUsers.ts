import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';

export const USERS_QUERY_KEY = ['users'] as const;

export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => apiService.getUsers(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof apiService.updateUser>[1] }) =>
      apiService.updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.toggleUserStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}
