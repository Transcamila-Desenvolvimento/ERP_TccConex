import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/apiService';

export const INDICADORES_KPIS_KEY = ['indicadores', 'kpis'] as const;
export const INDICADORES_FILIAIS_KEY = ['indicadores', 'filiais'] as const;

export function useIndicadorKpis() {
  return useQuery({
    queryKey: INDICADORES_KPIS_KEY,
    queryFn: () => apiService.getIndicadorKpis(),
  });
}

export function useIndicadorFiliais() {
  return useQuery({
    queryKey: INDICADORES_FILIAIS_KEY,
    queryFn: () => apiService.getIndicadorFiliais(),
  });
}
