import React, { useState, useEffect, useMemo } from 'react';
import { ADMIN_ENVIRONMENT } from '../../constants/environments';
import { useAuth } from '../../contexts/AuthContext';
import type { User, Role } from '../../types/domain';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserStatus,
} from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';

const MODULE_PERMISSIONS = [
  { module: 'Financeiro', branch: 'Ibiporã (Matriz)', id: 'fin-ibipora' },
  { module: 'Financeiro', branch: 'Rondonópolis', id: 'fin-rondonopolis' },
  { module: 'Financeiro', branch: 'Paranaguá', id: 'fin-paranagua' },
  { module: 'Indicadores', branch: 'Ibiporã (Matriz)', id: 'ind-ibipora' },
  { module: 'Indicadores', branch: 'Rondonópolis', id: 'ind-rondonopolis' },
  { module: 'Indicadores', branch: 'Paranaguá', id: 'ind-paranagua' },
] as const;

const isAdminRole = (role: Role | undefined, roleId: string) =>
  role?.permissions.includes(ADMIN_ENVIRONMENT) ?? roleId === '1';

const AdminWorkspace: React.FC = () => {
  const { user: currentUser } = useAuth();

  const { data: usersList = [], isError: usersError } = useUsers();
  const { data: roles = [], isError: rolesError } = useRoles();
  const { data: auditLogs = [], isError: auditError } = useAuditLogs();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toggleUserStatus = useToggleUserStatus();

  const defaultRoleId = useMemo(
    () => roles.find((r) => !r.permissions.includes(ADMIN_ENVIRONMENT))?.id ?? roles[0]?.id ?? '2',
    [roles],
  );

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('2');
  const [status, setStatus] = useState('ativo');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === roleId),
    [roles, roleId],
  );

  const isSelectedAdmin = isAdminRole(selectedRole, roleId);

  useEffect(() => {
    if (usersError) {
      alert('Erro ao carregar usuários. Verifique a conexão com o servidor.');
    }
    if (rolesError) {
      alert('Erro ao carregar funções de acesso. Verifique a conexão com o servidor.');
    }
    if (auditError) {
      alert('Erro ao carregar logs de auditoria. Verifique a conexão com o servidor.');
    }
  }, [usersError, rolesError, auditError]);

  useEffect(() => {
    if (defaultRoleId) setRoleId(defaultRoleId);
  }, [defaultRoleId]);

  // Filter user list when search/filters change
  useEffect(() => {
    let temp = [...usersList];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      temp = temp.filter(u => 
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'todos') {
      temp = temp.filter(u => u.roleId === roleFilter);
    }

    if (statusFilter !== 'todos') {
      temp = temp.filter(u => u.status === statusFilter);
    }

    setFilteredUsers(temp);
  }, [usersList, searchQuery, roleFilter, statusFilter]);

  // Handle open modal for creation
  const handleOpenCreate = () => {
    setEditingUserId(null);
    setUsername('');
    setName('');
    setPassword('');
    setRoleId(defaultRoleId);
    setStatus('ativo');
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  // Handle open modal for edition
  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setName(user.name);
    setPassword('');
    setRoleId(user.roleId);
    setStatus(user.status);
    
    // Parse permission IDs
    const perms: string[] = [];
    const userEnvs = user.environments || [];
    const userFiliais = user.filiais || {};

    const allPermsList = MODULE_PERMISSIONS;

    allPermsList.forEach(p => {
      if (userEnvs.includes(p.module)) {
        const branches = userFiliais[p.module] || [];
        if (branches.includes(p.branch)) {
          perms.push(p.id);
        }
      }
    });

    setSelectedPermissions(perms);
    setIsModalOpen(true);
  };

  // Form submit (create or update user)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allPermsList = MODULE_PERMISSIONS;

    // Map permissions back to environments and filiais
    const environments: string[] = [];
    const filiais: Record<string, string[]> = {};

    if (isSelectedAdmin) {
      // Backend enforces all envs/filiais for admin — send minimal data
      environments.push(ADMIN_ENVIRONMENT, 'Financeiro', 'Indicadores');
      ['Financeiro', 'Indicadores'].forEach(env => {
        filiais[env] = ['Ibiporã (Matriz)', 'Rondonópolis', 'Paranaguá'];
      });
    } else {
      selectedPermissions.forEach(pId => {
        const p = allPermsList.find(x => x.id === pId);
        if (p) {
          if (!environments.includes(p.module)) environments.push(p.module);
          if (!filiais[p.module]) filiais[p.module] = [];
          filiais[p.module].push(p.branch);
        }
      });
    }

    const userData: any = { username, name, roleId, status, environments, filiais };
    if (password) userData.password = password;

    try {
      if (editingUserId) {
        await updateUser.mutateAsync({ id: editingUserId, data: userData });
        alert('Usuário atualizado com sucesso.');
      } else {
        await createUser.mutateAsync(userData);
        alert('Novo usuário operacional criado!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data?.username?.[0] || err.message || 'Erro ao salvar usuário.';
      alert(detail);
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert('Não é permitido desativar seu próprio usuário ativo.');
      return;
    }
    try {
      const newStatus = await toggleUserStatus.mutateAsync(targetUser.id);
      alert(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso.`);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Erro ao alterar status do usuário.');
    }
  };

  const handleDelete = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert('Não é permitido remover seu próprio usuário conectado.');
      return;
    }
    if (window.confirm('Deseja realmente excluir permanentemente este usuário do sistema?')) {
      try {
        await deleteUser.mutateAsync(targetUser.id);
        alert('Usuário removido com sucesso.');
      } catch (err: any) {
        alert(err?.response?.data?.detail || 'Erro ao excluir usuário.');
      }
    }
  };

  const handleTogglePermissionChip = (id: string) => {
    if (isSelectedAdmin) return; // Admin is locked to all permissions
    
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const activeUsersCount = useMemo(
    () => usersList.filter((u) => u.status === 'ativo').length,
    [usersList],
  );

  const allPermissionsList = MODULE_PERMISSIONS;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__title-group">
          <div className="admin-page__accent" />
          <div>
            <h1 className="admin-page__title">Controle Geral de Usuários</h1>
            <p className="admin-page__subtitle">
              {activeTab === 'users'
                ? 'Gerencie cadastros, funções de acesso e permissões por filial.'
                : 'Histórico de ações realizadas no sistema.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="reports-action-btn primary"
          id="btn-admin-new-user"
          onClick={handleOpenCreate}
          style={{ display: activeTab === 'users' ? undefined : 'none' }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Criar Usuário</span>
        </button>
      </header>

      <div className="admin-page__tabs">
        <div className="segmented-tabs-container">
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Usuários
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Logs de Auditoria
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
      <div className="reports-meta-bar">
        <div className="reports-meta-item">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span>Total: <strong>{usersList.length}</strong> usuários</span>
        </div>
        <div className="reports-meta-item">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Ativos: <strong>{activeUsersCount}</strong></span>
        </div>
        <div className="reports-meta-item">
          <span>Exibidos: <strong>{filteredUsers.length}</strong></span>
        </div>
      </div>

      <div className="reports-filters-bar">
        <div className="reports-filter-left" style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="reports-search-wrapper" style={{ minWidth: '280px' }}>
            <svg className="search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome ou usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="reports-select-wrapper">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="todos">Função: Todas</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="reports-select-wrapper">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="todos">Status: Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
        <div className="reports-filter-right">
          <span className="reports-records-count"><strong>{filteredUsers.length}</strong> exibidos</span>
        </div>
      </div>

      <div className="erp-card reports-table-card admin-page__card admin-page__card--fill">
        <div className="table-container admin-page__table-fill">
          <table className="erp-table reports-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Nome Completo</th>
                <th>Função</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th>Último Acesso</th>
                <th style={{ width: '220px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-page__empty">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const roleName = roles.find((r) => r.id === u.roleId)?.name || 'Operador';
                  const nameParts = u.name.split(' ');
                  const initials = nameParts.length > 1
                    ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
                    : u.name.slice(0, 2);
                  const lastLoginStr = u.lastLogin
                    ? `${new Date(u.lastLogin).toLocaleDateString('pt-BR')} ${new Date(u.lastLogin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Nunca logou';

                  return (
                    <tr key={u.id} className={idx % 2 === 1 ? 'zebra-row' : ''}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">{initials.toUpperCase()}</div>
                          <strong>{u.username}</strong>
                        </div>
                      </td>
                      <td>{u.name}</td>
                      <td><span className="admin-role-label">{roleName}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${u.status === 'ativo' ? 'success' : 'inativo'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td><span className="admin-muted">{lastLoginStr}</span></td>
                      <td>
                        <div className="admin-table-actions">
                          <button type="button" className="admin-table-action" onClick={() => handleOpenEdit(u)}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Editar
                          </button>
                          <button type="button" className="admin-table-action admin-table-action--warn" onClick={() => handleToggleStatus(u)}>
                            {u.status === 'ativo' ? 'Inativar' : 'Ativar'}
                          </button>
                          <button type="button" className="admin-table-action admin-table-action--danger" onClick={() => handleDelete(u)}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {activeTab === 'audit' && (
        <>
      <div className="reports-meta-bar">
        <div className="reports-meta-item">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span>Total: <strong>{auditLogs.length}</strong> registros</span>
        </div>
        <div className="reports-meta-item">
          <span>Exibindo os <strong>{Math.min(auditLogs.length, 50)}</strong> mais recentes</span>
        </div>
      </div>

      <div className="erp-card reports-table-card admin-page__card admin-page__card--fill">
        <div className="table-container admin-page__table-fill">
          <table className="erp-table reports-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Data/Hora</th>
                <th style={{ width: '140px' }}>Usuário</th>
                <th style={{ width: '160px' }}>Ação</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-page__empty">
                    Nenhum log de auditoria registrado.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 50).map((log, idx) => (
                  <tr key={log.id} className={idx % 2 === 1 ? 'zebra-row' : ''}>
                    <td><span className="admin-muted">{new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></td>
                    <td><strong>{log.username || log.userId || '—'}</strong></td>
                    <td>
                      <span className={`admin-audit-chip ${log.action === 'login' ? 'admin-audit-chip--login' : ''}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* MODAL: CRIAR / EDITAR USUÁRIO */}
      {isModalOpen && (
        <div className="search-backdrop" id="user-admin-modal" style={{ display: 'flex' }} onClick={(e) => {
          if (e.target === e.currentTarget) setIsModalOpen(false);
        }}>
          <div className="search-modal-card" style={{ width: '450px' }}>
            <div className="search-input-wrapper" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="admin-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {editingUserId ? 'Editar Usuário' : 'Criar Novo Usuário'}
              </h3>
              <span className="search-close-key" style={{ cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>Fechar (X)</span>
            </div>
            
            <form id="admin-user-form" style={{ padding: '20px 24px 24px 24px' }} onSubmit={handleSubmit}>
              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="admin-user-username">Usuário (Username)</label>
                <input 
                  type="text" 
                  id="admin-user-username" 
                  placeholder="Ex: joao.santos" 
                  required 
                  readOnly={!!editingUserId}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off" 
                />
              </div>
              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="admin-user-name">Nome Completo</label>
                <input 
                  type="text" 
                  id="admin-user-name" 
                  placeholder="Ex: João dos Santos" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off" 
                />
              </div>
              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="admin-user-password">Senha</label>
                <input 
                  type="password" 
                  id="admin-user-password" 
                  placeholder="Preencha apenas para definir nova senha" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password" 
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '2px', fontSize: '11px' }}>
                  Se vazio ao criar, a senha padrão será <strong>123456</strong>.
                </small>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '14px' }}>
                <div className="login-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="admin-user-role">Função</label>
                  <select 
                    id="admin-user-role" 
                    className="selection-select" 
                    style={{ height: '40px' }} 
                    required
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="login-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="admin-user-status">Status</label>
                  <select 
                    id="admin-user-status" 
                    className="selection-select" 
                    style={{ height: '40px' }} 
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              
              {/* Permission Chips Section */}
              <div style={{ marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Acesso por Módulo e Filial</h4>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 14px 0' }}>Selecione os módulos e filiais autorizados clicando nos cards abaixo:</p>
                
                {isSelectedAdmin ? (
                  <div id="admin-drag-info-message" style={{ display: 'block', fontSize: '12px', color: '#0076ce', background: '#eff6ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '12px' }}>
                    Administradores possuem acesso total a todos os módulos e filiais por padrão.
                  </div>
                ) : null}

                <div 
                  id="permissions-chips-grid" 
                  className="permissions-chips-grid"
                  style={{ opacity: isSelectedAdmin ? 0.4 : 1, pointerEvents: isSelectedAdmin ? 'none' : 'auto' }}
                >
                  {allPermissionsList.map((perm) => {
                    const modLower = perm.module.toLowerCase();
                    const isActive = isSelectedAdmin || selectedPermissions.includes(perm.id);

                    return (
                      <div 
                        key={perm.id}
                        className={`permission-chip ${isActive ? `active-${modLower}` : ''}`}
                        onClick={() => handleTogglePermissionChip(perm.id)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>{perm.branch}</span>
                          <span className="permission-chip-module">{perm.module}</span>
                        </div>
                        <span className="permission-chip-icon">{isActive ? '✓' : '+'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <button type="submit" className="btn-login" id="btn-admin-submit-user">Salvar Usuário</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkspace;
