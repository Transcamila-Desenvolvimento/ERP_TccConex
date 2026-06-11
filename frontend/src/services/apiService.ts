import axios from 'axios';
import type {
  User, Role, SystemLog, PagarRow, ReceberRow, AgingRow, ReportBatch,
  BillingRecord, CashAdjustment, BankAccount, BalanceHistoryEntry,
  IndicadorKpi, IndicadorFilialRow,
} from '../types/domain';
import { filterActiveEnvironments, ACTIVE_ENVIRONMENTS } from '../constants/environments';

const activeEnvSet = new Set<string>(ACTIVE_ENVIRONMENTS);
import type { ReportImportResult, ReportImportType } from './reportImportService';

// Vite proxies /api → http://localhost:8001 in dev (see vite.config.ts)
const api = axios.create();

const TOKEN_KEY = 'prothon_token';
const ENV_KEY = 'prothon_env';
const FILIAL_KEY = 'prothon_filial';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const env = localStorage.getItem(ENV_KEY);
  const filial = localStorage.getItem(FILIAL_KEY);
  if (env) config.headers['X-Prothon-Environment'] = env;
  if (filial) config.headers['X-Prothon-Filial'] = filial;

  return config;
});

// Normalize backend user: int id → string, already has lastLogin from serializer
function normalizeUser(raw: any): User {
  return {
    id: String(raw.id),
    username: raw.username,
    name: raw.name,
    roleId: raw.roleId,
    status: raw.status,
    lastLogin: raw.lastLogin ?? null,
    environments: filterActiveEnvironments(raw.environments),
    filiais: Object.fromEntries(
      Object.entries(raw.filiais ?? {}).filter(([module]) => activeEnvSet.has(module)),
    ) as Record<string, string[]>,
  };
}

function normalizeReportBatch(raw: any): ReportBatch {
  return {
    id: String(raw.id),
    label: raw.label,
    date: raw.date,
    updatedBy: raw.updatedBy,
    importedReports: raw.importedReports,
    isActive: raw.isActive,
  };
}

function normalizePagarRow(raw: any): PagarRow {
  return {
    id: raw.id != null ? String(raw.id) : undefined,
    filial: raw.filial,
    codForn: raw.codForn,
    fornecedor: raw.fornecedor,
    titulo: raw.titulo,
    tipo: raw.tipo,
    emissao: raw.emissao,
    vencimento: raw.vencimento,
    vencimentoReal: raw.vencimentoReal,
    valor: Number(raw.valor),
    saldo: Number(raw.saldo),
    historico: raw.historico ?? '',
  };
}

function normalizeReceberRow(raw: any): ReceberRow {
  return {
    id: raw.id != null ? String(raw.id) : undefined,
    filial: raw.filial,
    codCliente: raw.codCliente,
    cliente: raw.cliente,
    titulo: raw.titulo,
    natureza: raw.natureza,
    emissao: raw.emissao,
    vencimento: raw.vencimento,
    vencimentoReal: raw.vencimentoReal,
    valor: Number(raw.valor),
    saldo: Number(raw.saldo),
    historico: raw.historico ?? '',
  };
}

function normalizeAgingRow(raw: any): AgingRow {
  return {
    id: raw.id != null ? String(raw.id) : undefined,
    origem: raw.origem,
    codCliente: raw.codCliente,
    cliente: raw.cliente,
    loja: raw.loja,
    docto: raw.docto,
    serie: raw.serie,
    tipo: raw.tipo,
    emissao: raw.emissao,
    vencimento: raw.vencimento,
    regiao: raw.regiao,
    total: Number(raw.total),
  };
}

function normalizeBillingRecord(raw: any): BillingRecord {
  return {
    id: Number(raw.id),
    date: raw.date,
    branch: raw.branch,
    value: Number(raw.value),
    notesCount: Number(raw.notesCount ?? raw.notes_count ?? 0),
  };
}

function normalizeCashAdjustment(raw: any): CashAdjustment {
  return {
    id: Number(raw.id),
    date: raw.date,
    type: raw.type,
    value: Number(raw.value),
    observation: raw.observation ?? '',
    user: raw.user ?? '',
  };
}

function normalizeBankAccount(raw: any): BankAccount {
  return {
    id: Number(raw.id),
    bank: raw.bank,
    agency: raw.agency,
    number: raw.number,
    type: raw.type,
    balance: Number(raw.balance),
    lastUpdated: raw.lastUpdated ?? raw.last_updated ?? '',
  };
}

function normalizeBalanceHistoryEntry(raw: any): BalanceHistoryEntry {
  return {
    id: Number(raw.id),
    accountId: Number(raw.accountId ?? raw.account_id ?? raw.account),
    date: raw.date,
    bank: raw.bank,
    number: raw.number,
    type: raw.type,
    value: Number(raw.value),
  };
}

function normalizeIndicadorKpi(raw: any): IndicadorKpi {
  return {
    label: raw.label,
    value: raw.value,
    change: raw.change,
    up: Boolean(raw.up),
  };
}

function normalizeIndicadorFilial(raw: any): IndicadorFilialRow {
  return {
    filial: raw.filial,
    receita: raw.receita,
    fretes: Number(raw.fretes),
    toneladas: raw.toneladas,
    meta: raw.meta,
  };
}

function listFromResponse<T>(data: unknown, normalizer: (raw: any) => T): T[] {
  const list = Array.isArray(data) ? data : ((data as { results?: unknown[] })?.results ?? []);
  return list.map(normalizer);
}

export interface ReportQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filial?: string;
  party?: string;
  tipo?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ReportFacets {
  filiais: string[];
  parties: string[];
  tipos: string[];
}

function buildReportQueryParams(params: ReportQueryParams = {}) {
  const query: Record<string, string | number> = {};
  if (params.page) query.page = params.page;
  if (params.pageSize) query.page_size = params.pageSize;
  if (params.search) query.search = params.search;
  if (params.filial) query.filial = params.filial;
  if (params.party) query.party = params.party;
  if (params.tipo) query.tipo = params.tipo;
  return query;
}

function paginatedFromResponse<T>(data: unknown, normalizer: (raw: any) => T): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    const results = data.map(normalizer);
    return { results, count: results.length, next: null, previous: null };
  }
  const body = data as { results?: unknown[]; count?: number; next?: string | null; previous?: string | null };
  return {
    results: (body.results ?? []).map(normalizer),
    count: Number(body.count ?? 0),
    next: body.next ?? null,
    previous: body.previous ?? null,
  };
}

const sleep = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

function normalizeImportResult(raw: any, type: ReportImportType, fileName = ''): ReportImportResult {
  const issues = Array.isArray(raw?.issues) ? raw.issues : [];
  if (issues.length === 0 && raw?.detail) {
    issues.push({ severity: 'error', message: String(raw.detail) });
  }
  return {
    type,
    fileName: raw?.fileName ?? fileName,
    success: raw?.success === true,
    rowCount: Number(raw?.rowCount ?? 0),
    skippedRows: Number(raw?.skippedRows ?? 0),
    issues,
    data: [],
  };
}

export const apiService = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clearToken: (): void => localStorage.removeItem(TOKEN_KEY),

  async pollCeleryTask<T>(taskId: string, maxAttempts = 180, intervalMs = 1000): Promise<T> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data } = await api.get(`/api/financeiro/tasks/${taskId}/`);
      if (data.status === 'SUCCESS') {
        return data.result as T;
      }
      if (data.status === 'FAILURE') {
        throw new Error(data.error ?? 'Falha ao processar a tarefa.');
      }
      await sleep(intervalMs);
    }
    throw new Error('Tempo esgotado aguardando processamento do arquivo.');
  },

  async login(username: string, password: string): Promise<User | null> {
    try {
      const { data } = await api.post('/api/auth/login/', { username, password });
      apiService.setToken(data.token);
      return normalizeUser(data.user);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        throw new Error('SERVER_OFFLINE');
      }
      return null;
    }
  },

  async getProfile(): Promise<User | null> {
    if (!apiService.getToken()) return null;
    try {
      const { data } = await api.get('/api/auth/profile/');
      return normalizeUser(data);
    } catch {
      apiService.clearToken();
      return null;
    }
  },

  async getUsers(): Promise<User[]> {
    const { data } = await api.get('/api/auth/users/');
    const list = Array.isArray(data) ? data : (data.results ?? []);
    return list.map(normalizeUser);
  },

  async createUser(userData: any): Promise<User> {
    const { data } = await api.post('/api/auth/users/', userData);
    return normalizeUser(data);
  },

  async updateUser(id: string, userData: any): Promise<User> {
    const { data } = await api.patch(`/api/auth/users/${id}/`, userData);
    return normalizeUser(data);
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/api/auth/users/${id}/`);
  },

  async toggleUserStatus(id: string): Promise<string> {
    const { data } = await api.post(`/api/auth/users/${id}/toggle_status/`);
    return data.status as string;
  },

  async getRoles(): Promise<Role[]> {
    const { data } = await api.get('/api/auth/roles/');
    const list = Array.isArray(data) ? data : (data.results ?? []);
    return list.map((raw: any) => ({
      id: String(raw.id),
      name: raw.name,
      description: raw.description ?? '',
      permissions: raw.permissions ?? [],
    }));
  },

  async getAuditLogs(): Promise<SystemLog[]> {
    const { data } = await api.get('/api/audit/logs/');
    const list = Array.isArray(data) ? data : (data.results ?? []);
    return list.map((raw: any) => ({
      id: String(raw.id),
      userId: raw.userId ?? '',
      username: raw.username ?? '',
      action: raw.action,
      details: raw.details ?? '',
      timestamp: raw.timestamp,
    }));
  },

  // ─── Financeiro — Relatórios (Django API + SQLite/PostgreSQL) ────────────────

  async getReportBatches(): Promise<ReportBatch[]> {
    const { data } = await api.get('/api/financeiro/batches/');
    const list = Array.isArray(data) ? data : (data.results ?? []);
    return list.map(normalizeReportBatch);
  },

  async getPagarReport(params: ReportQueryParams = {}): Promise<PaginatedResponse<PagarRow>> {
    const { data } = await api.get('/api/financeiro/reports/pagar/', { params: buildReportQueryParams(params) });
    return paginatedFromResponse(data, normalizePagarRow);
  },

  async getReceberReport(params: ReportQueryParams = {}): Promise<PaginatedResponse<ReceberRow>> {
    const { data } = await api.get('/api/financeiro/reports/receber/', { params: buildReportQueryParams(params) });
    return paginatedFromResponse(data, normalizeReceberRow);
  },

  async getAgingReport(params: ReportQueryParams = {}): Promise<PaginatedResponse<AgingRow>> {
    const { data } = await api.get('/api/financeiro/reports/aging/', { params: buildReportQueryParams(params) });
    return paginatedFromResponse(data, normalizeAgingRow);
  },

  async getReportFacets(reportType: 'pagar' | 'receber' | 'aging'): Promise<ReportFacets> {
    const { data } = await api.get(`/api/financeiro/reports/${reportType}/facets/`);
    return {
      filiais: data.filiais ?? [],
      parties: data.parties ?? [],
      tipos: data.tipos ?? [],
    };
  },

  async importReport(batchId: string, type: ReportImportType, file: File): Promise<ReportImportResult> {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    try {
      const response = await api.post(`/api/financeiro/batches/${batchId}/import_report/`, form, {
        timeout: 120000,
        validateStatus: (s) => s === 200 || s === 202 || s === 400 || s === 500,
      });
      const { data, status: httpStatus } = response;
      if (httpStatus === 202 && data.taskId) {
        const result = await this.pollCeleryTask<Record<string, unknown>>(data.taskId);
        return normalizeImportResult(result, type, file.name);
      }
      return normalizeImportResult(data, type, file.name);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        return normalizeImportResult(err.response.data, type, file.name);
      }
      if (axios.isAxiosError(err) && !err.response) {
        return normalizeImportResult(
          { detail: err.message?.includes('Tempo esgotado')
            ? err.message
            : 'Servidor indisponível ou tempo esgotado. Verifique se o backend está rodando.' },
          type,
          file.name,
        );
      }
      throw err;
    }
  },

  async finalizeReportBatch(batchId: string): Promise<ReportBatch> {
    const { data } = await api.post(`/api/financeiro/batches/${batchId}/finalize/`);
    return normalizeReportBatch(data);
  },

  // ─── Financeiro — Faturamento, Ajustes, Saldos (Django API) ─────────────────

  async getBillingRecords(): Promise<BillingRecord[]> {
    const { data } = await api.get('/api/financeiro/billing/');
    return listFromResponse(data, normalizeBillingRecord);
  },

  async importBillingXml(file: File): Promise<{
    success: boolean;
    rowCount: number;
    totalValue: number;
    totalNotes: number;
    dates: string[];
    detail?: string;
  }> {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/api/financeiro/billing/import_xml/', form, {
      timeout: 120000,
      validateStatus: (s) => s === 200 || s === 202 || s === 400,
    });
    const { data, status: httpStatus } = response;
    if (httpStatus === 202 && data.taskId) {
      return this.pollCeleryTask(data.taskId);
    }
    return data;
  },

  async updateBillingRecord(id: number, payload: Partial<Omit<BillingRecord, 'id'>>): Promise<BillingRecord> {
    const { data } = await api.patch(`/api/financeiro/billing/${id}/`, payload);
    return normalizeBillingRecord(data);
  },

  async deleteBillingRecord(id: number): Promise<void> {
    await api.delete(`/api/financeiro/billing/${id}/`);
  },

  async getCashAdjustments(): Promise<CashAdjustment[]> {
    const { data } = await api.get('/api/financeiro/adjustments/');
    return listFromResponse(data, normalizeCashAdjustment);
  },

  async createCashAdjustment(payload: Omit<CashAdjustment, 'id'>): Promise<CashAdjustment> {
    const { data } = await api.post('/api/financeiro/adjustments/', payload);
    return normalizeCashAdjustment(data);
  },

  async updateCashAdjustment(id: number, payload: Partial<Omit<CashAdjustment, 'id'>>): Promise<CashAdjustment> {
    const { data } = await api.patch(`/api/financeiro/adjustments/${id}/`, payload);
    return normalizeCashAdjustment(data);
  },

  async deleteCashAdjustment(id: number): Promise<void> {
    await api.delete(`/api/financeiro/adjustments/${id}/`);
  },

  async getBankAccounts(): Promise<BankAccount[]> {
    const { data } = await api.get('/api/financeiro/bank-accounts/');
    return listFromResponse(data, normalizeBankAccount);
  },

  async getBalanceHistory(): Promise<BalanceHistoryEntry[]> {
    const { data } = await api.get('/api/financeiro/balance-history/');
    return listFromResponse(data, normalizeBalanceHistoryEntry);
  },

  async syncBankData(accounts: BankAccount[], history: BalanceHistoryEntry[]): Promise<{
    accounts: BankAccount[];
    history: BalanceHistoryEntry[];
  }> {
    const { data } = await api.post('/api/financeiro/bank-data/sync/', { accounts, history });
    return {
      accounts: (data.accounts ?? []).map(normalizeBankAccount),
      history: (data.history ?? []).map(normalizeBalanceHistoryEntry),
    };
  },

  // ─── Indicadores ───────────────────────────────────────────────────────────

  async getIndicadorKpis(): Promise<IndicadorKpi[]> {
    const { data } = await api.get('/api/indicadores/kpis/');
    return listFromResponse(data, normalizeIndicadorKpi);
  },

  async getIndicadorFiliais(): Promise<IndicadorFilialRow[]> {
    const { data } = await api.get('/api/indicadores/filiais/');
    return listFromResponse(data, normalizeIndicadorFilial);
  },

  // ─── Filesystem (export modal — Django API) ─────────────────────────────────

  async fsGetHomeDir(): Promise<string> {
    const { data } = await api.get('/api/fs/homedir');
    return data.homeDir;
  },

  async fsListDirectory(path: string): Promise<{ currentPath: string; parentPath: string | null; subdirs: string[] }> {
    const { data } = await api.get('/api/fs/list', { params: { path } });
    if (!data.success) {
      throw new Error(data.error ?? 'Erro ao listar diretório.');
    }
    return {
      currentPath: data.currentPath,
      parentPath: data.parentPath,
      subdirs: data.subdirs ?? [],
    };
  },

  async fsWriteFile(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    const { data } = await api.post('/api/fs/write', { filePath, content });
    return data;
  },
};
