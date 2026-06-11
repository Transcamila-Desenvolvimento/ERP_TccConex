export type ReportImportType = 'pagar' | 'receber' | 'aging';

export interface ImportIssue {
  row?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ReportImportResult {
  type: ReportImportType;
  fileName: string;
  success: boolean;
  rowCount: number;
  skippedRows: number;
  issues: ImportIssue[];
  data: unknown[];
}

export const REPORT_TEMPLATE_HINTS: Record<ReportImportType, string> = {
  pagar: 'Contas a pagar DD.MM.AAAA.xlsx',
  receber: 'CRs e Faturas vencidas Posição DD.MM.AAAA Fluxo Novo.xlsx',
  aging: 'aging luft.xlsx',
};
