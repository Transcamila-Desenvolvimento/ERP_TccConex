/** Tipos de domínio compartilhados entre frontend e API Django. */

export interface User {
  id: string;
  username: string;
  name: string;
  roleId: string;
  status: string;
  lastLogin: string | null;
  environments: string[];
  filiais: Record<string, string[]>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  username?: string;
  action: string;
  details: string;
}

export interface PagarRow {
  id?: string;
  selected?: boolean;
  filial: string;
  codForn: string;
  fornecedor: string;
  titulo: string;
  tipo: string;
  emissao: string;
  vencimento: string;
  vencimentoReal: string;
  valor: number;
  saldo: number;
  historico: string;
}

export interface ReceberRow {
  id?: string;
  selected?: boolean;
  filial: string;
  codCliente: string;
  cliente: string;
  titulo: string;
  natureza: string;
  emissao: string;
  vencimento: string;
  vencimentoReal: string;
  valor: number;
  saldo: number;
  historico: string;
}

export interface AgingRow {
  id?: string;
  selected?: boolean;
  origem: string;
  codCliente: string;
  cliente: string;
  loja: string;
  docto: string;
  serie: string;
  tipo: string;
  emissao: string;
  vencimento: string;
  regiao: string;
  total: number;
}

export interface ReportBatch {
  id: string;
  label: string;
  date: string;
  updatedBy: string;
  importedReports: { pagar: boolean; receber: boolean; aging: boolean };
  isActive: boolean;
}

export interface BillingRecord {
  id: number;
  date: string;
  branch: string;
  value: number;
  notesCount: number;
}

export interface CashAdjustment {
  id: number;
  date: string;
  type: string;
  value: number;
  observation: string;
  user: string;
}

export interface BankAccount {
  id: number;
  bank: string;
  agency: string;
  number: string;
  type: string;
  balance: number;
  lastUpdated: string;
}

export interface BalanceHistoryEntry {
  id: number;
  accountId: number;
  date: string;
  bank: string;
  number: string;
  type: string;
  value: number;
}

export interface IndicadorKpi {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

export interface IndicadorFilialRow {
  filial: string;
  receita: string;
  fretes: number;
  toneladas: string;
  meta: string;
}
