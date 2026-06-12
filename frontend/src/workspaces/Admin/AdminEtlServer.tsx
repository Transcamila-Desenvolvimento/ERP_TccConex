import React, { useEffect, useState } from 'react';
import etlServerIcon from '../../assets/ETL-Server.svg';

type ExecutionResult = 'success' | 'error' | 'pending' | 'running' | null;
type ServerStatus = 'online' | 'restarting';
type WorkflowId = 'esl-faturamento' | 'protheus-cp';

type WorkflowState = {
  selected: boolean;
  lastExecution: string | null;
  executionResult: ExecutionResult;
};

const WORKFLOWS: { id: WorkflowId; title: string; description: string }[] = [
  {
    id: 'esl-faturamento',
    title: 'Integração ESL (Faturamento)',
    description: 'Sincronização de faturamento diário por filial',
  },
  {
    id: 'protheus-cp',
    title: 'Integração Protheus (Contas a pagar)',
    description: 'Sincronização do relatorio financeiro CP',
  },
];

const createInitialWorkflowState = (): Record<WorkflowId, WorkflowState> =>
  Object.fromEntries(
    WORKFLOWS.map((w) => [w.id, { selected: false, lastExecution: null, executionResult: null }]),
  ) as Record<WorkflowId, WorkflowState>;

const SERVER_INFO = {
  name: 'Principal',
  host: 'etl-server.local:8080',
  version: '1.0.0-dev',
} as const;

const formatUptime = (since: number) => {
  const mins = Math.floor((Date.now() - since) / 60000);
  if (mins < 1) return 'menos de 1 min';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hours}h ${rem}min` : `${hours}h`;
};

const formatLastExecution = (iso: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const resultLabel: Record<NonNullable<ExecutionResult>, string> = {
  success: 'Sucesso',
  error: 'Falha',
  pending: 'Pendente',
  running: 'Em execução',
};

const resultBadgeClass: Record<NonNullable<ExecutionResult>, string> = {
  success: 'success',
  error: 'inativo',
  pending: 'pending',
  running: 'syncing',
};

const AdminEtlServer: React.FC = () => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [isServerInfoOpen, setIsServerInfoOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('online');
  const [onlineSince, setOnlineSince] = useState(() => Date.now());
  const [workflows, setWorkflows] = useState(createInitialWorkflowState);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#admin-etl-actions')) {
        setIsActionsOpen(false);
      }
      if (!target.closest('#admin-etl-server-actions')) {
        setIsServerMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const activeIntegrations = WORKFLOWS.filter((w) => workflows[w.id].selected).length;
  const isConfigured = activeIntegrations > 0;
  const canManageServer = serverStatus !== 'restarting';

  const toggleWorkflowSelected = (id: WorkflowId, selected: boolean) => {
    setWorkflows((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected },
    }));
  };

  const latestExecution = WORKFLOWS.map((w) => workflows[w.id].lastExecution)
    .filter((iso): iso is string => iso !== null)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  const handleRestartServer = () => {
    setIsServerMenuOpen(false);
    setServerStatus('restarting');
    window.setTimeout(() => {
      setServerStatus('online');
      setOnlineSince(Date.now());
    }, 2500);
  };

  const handleOpenServerInfo = () => {
    setIsServerMenuOpen(false);
    setIsServerInfoOpen(true);
  };

  const handleOpenServerConsole = () => {
    window.open(`http://${SERVER_INFO.host}`, '_blank', 'noopener,noreferrer');
  };

  const serverStatusLabel =
    serverStatus === 'restarting' ? 'Reiniciando' : serverStatus === 'online' ? 'Ativo' : 'Offline';

  const serverStatusBadgeClass =
    serverStatus === 'online' ? 'success' : serverStatus === 'restarting' ? 'syncing' : 'inativo';

  const uptimeDisplay = serverStatus === 'online' ? formatUptime(onlineSince) : null;

  const lastExecutionDisplay = formatLastExecution(latestExecution);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '4px' }}>
      <header
        className="view-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '6px', height: '22px', backgroundColor: '#118CC4' }} />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>ETL Server</h1>
        </div>
      </header>

      <div className="admin-etl-server-panel erp-card" title="ETL Server">
        <div className="admin-etl-server-panel__main">
          <div className="admin-etl-server-panel__title-row">
            <img src={etlServerIcon} alt="" className="billing-etl-bar__icon" aria-hidden="true" />
            <span className="billing-etl-bar__label">ETL Server</span>
            <span className={`status-badge ${serverStatusBadgeClass}`}>{serverStatusLabel}</span>
            {serverStatus === 'restarting' && (
              <span className="admin-etl-server-panel__spinner" aria-hidden="true">
                <span className="spinner" />
              </span>
            )}
          </div>
          <p className="admin-etl-server-panel__summary">
            {SERVER_INFO.host}
            {' · '}
            {SERVER_INFO.version}
            {uptimeDisplay && (
              <>
                {' · '}
                ativo há {uptimeDisplay}
              </>
            )}
            {' · '}
            {activeIntegrations === 0
              ? 'nenhuma integração ativa'
              : activeIntegrations === 1
                ? '1 integração ativa'
                : `${activeIntegrations} integrações ativas`}
          </p>
        </div>

        <div className="admin-etl-server-panel__actions">
          <button
            type="button"
            className="admin-etl-server-panel__icon-btn"
            aria-label="Abrir console do servidor em nova aba"
            title="Abrir console do servidor"
            onClick={handleOpenServerConsole}
          >
            <svg className="admin-etl-server-panel__icon-btn-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div id="admin-etl-server-actions" className="admin-etl-bar__server reports-dropdown-wrapper">
          <button
            type="button"
            className="reports-action-btn primary admin-etl-bar__server-btn"
            style={{ backgroundColor: '#118CC4', borderColor: '#118CC4' }}
            disabled={serverStatus === 'restarting'}
            onClick={(e) => {
              e.stopPropagation();
              setIsServerMenuOpen(!isServerMenuOpen);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Servidor{serverStatus === 'restarting' ? ' (Reiniciando...)' : ''}</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`reports-dropdown-menu ${isServerMenuOpen ? 'show' : ''}`}>
            <span
              className="reports-dropdown-item"
              onClick={handleRestartServer}
              style={!canManageServer ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
            >
              Reiniciar
            </span>
            <span className="reports-dropdown-item" onClick={handleOpenServerInfo}>
              Informações
            </span>
          </div>
        </div>
        </div>
      </div>

      <div className="admin-etl-workflows-header">
        <div className="admin-etl-workflows-header__title">
          <div className="admin-page__accent admin-page__accent--sm" />
          <h2>Papéis de trabalho</h2>
        </div>
        <div id="admin-etl-actions" className="reports-dropdown-wrapper">
          <button
            type="button"
            className="reports-action-btn secondary"
            onClick={(e) => {
              e.stopPropagation();
              setIsActionsOpen(!isActionsOpen);
            }}
          >
            <span>Ações</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`reports-dropdown-menu ${isActionsOpen ? 'show' : ''}`}>
            <span className="reports-dropdown-item" onClick={() => setIsActionsOpen(false)}>
              Ver logs
            </span>
            <span
              className="reports-dropdown-item"
              onClick={() => {
                setIsActionsOpen(false);
                if (!isConfigured) return;
                alert('Envio de atualização agendado — em desenvolvimento.');
              }}
              style={!isConfigured ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
            >
              Enviar atualização
            </span>
          </div>
        </div>
      </div>

      {isServerInfoOpen && (
        <div
          className="search-backdrop"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsServerInfoOpen(false);
          }}
        >
          <div className="search-modal-card admin-etl-info-modal">
            <div className="admin-etl-info-modal__header">
              <h3>Informações do ETL Server</h3>
              <button type="button" className="admin-etl-info-modal__close" onClick={() => setIsServerInfoOpen(false)}>
                Fechar
              </button>
            </div>
            <dl className="admin-etl-info-modal__list">
              <div className="admin-etl-info-modal__row">
                <dt>Servidor</dt>
                <dd>ETL Server — {SERVER_INFO.name}</dd>
              </div>
              <div className="admin-etl-info-modal__row">
                <dt>Status</dt>
                <dd>
                  <span className={`status-badge ${serverStatusBadgeClass}`}>
                    {serverStatusLabel}
                  </span>
                </dd>
              </div>
              <div className="admin-etl-info-modal__row">
                <dt>Versão</dt>
                <dd>{SERVER_INFO.version}</dd>
              </div>
              <div className="admin-etl-info-modal__row">
                <dt>Host</dt>
                <dd>{SERVER_INFO.host}</dd>
              </div>
              <div className="admin-etl-info-modal__row">
                <dt>Integrações ativas</dt>
                <dd>
                  {activeIntegrations === 0
                    ? '0'
                    : WORKFLOWS.filter((w) => workflows[w.id].selected)
                        .map((w) => w.title.replace('Integração ', ''))
                        .join(', ')}
                </dd>
              </div>
              <div className="admin-etl-info-modal__row">
                <dt>Última execução</dt>
                <dd>{lastExecutionDisplay}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      <div className="erp-card reports-table-card" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="erp-table reports-table">
            <thead>
              <tr>
                <th style={{ width: '48px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500, textAlign: 'center' }} aria-label="Selecionar" />
                <th style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Papel de trabalho</th>
                <th style={{ width: '180px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Última execução</th>
                <th style={{ width: '160px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500, textAlign: 'center' }}>Resultado da execução</th>
                <th style={{ width: '120px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {WORKFLOWS.map((workflow) => {
                const state = workflows[workflow.id];
                const lastRun = formatLastExecution(state.lastExecution);

                return (
                  <tr key={workflow.id}>
                    <td style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={(e) => toggleWorkflowSelected(workflow.id, e.target.checked)}
                        aria-label={`Selecionar ${workflow.title}`}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#118CC4' }}
                      />
                    </td>
                    <td style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{workflow.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{workflow.description}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <span className="admin-muted">{lastRun}</span>
                    </td>
                    <td style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'center', verticalAlign: 'middle' }}>
                      {state.executionResult ? (
                        <span className={`status-badge ${resultBadgeClass[state.executionResult]}`}>
                          {resultLabel[state.executionResult]}
                        </span>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>
                    <td style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span className={`status-badge ${state.selected ? 'success' : 'inativo'}`}>
                        {state.selected ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEtlServer;
