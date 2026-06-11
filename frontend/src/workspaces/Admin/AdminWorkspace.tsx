import React, { useState, useEffect, useMemo } from 'react';
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
  role?.permissions.includes('Administração') ?? roleId === '1';

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
    () => roles.find((r) => !r.permissions.includes('Administração'))?.id ?? roles[0]?.id ?? '2',
    [roles],
  );

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');

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
      environments.push('Administração', 'Financeiro', 'Indicadores');
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

  const allPermissionsList = MODULE_PERMISSIONS;

  return (
    <div style={{ padding: '4px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <header className="view-header" style={{ marginBottom: 0 }}>
          <h1>Controle Geral de Usuários</h1>
          <p>Gerencie o cadastro de usuários operacionais do ERP, altere funções de acesso, e configure permissões específicas por filial.</p>
        </header>
        <button 
          type="button" 
          className="btn-login" 
          id="btn-admin-new-user"
          style={{ width: 'auto', padding: '0 20px', margin: 0, height: '40px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0076ce' }}
          onClick={handleOpenCreate}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Criar Usuário</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="comercial-proposals-card">
        {/* Table Header Controls */}
        <div className="comercial-table-header" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
            {/* Search */}
            <div className="comercial-search-wrapper" style={{ width: '300px', margin: 0 }}>
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Buscar por nome ou usuário..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                className="comercial-select-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="todos">Todas Funções</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              
              <select 
                className="comercial-select-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="todos">Todos Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Nome Completo</th>
                <th>Função</th>
                <th>Status</th>
                <th>Último Acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '24px' }}>
                    Nenhum usuário operacional cadastrado com os filtros ativos.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleName = roles.find(r => r.id === u.roleId)?.name || 'Operador';
                  const initials = u.name.split(' ').length > 1 ? u.name.split(' ')[0][0] + u.name.split(' ')[u.name.split(' ').length - 1][0] : u.name.slice(0,2);
                  const formattedInitials = initials.toUpperCase();
                  
                  const lastLoginStr = u.lastLogin 
                    ? new Date(u.lastLogin).toLocaleDateString('pt-BR') + ' ' + new Date(u.lastLogin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
                    : 'Nunca logou';

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0076ce', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                            {formattedInitials}
                          </div>
                          <strong>{u.username}</strong>
                        </div>
                      </td>
                      <td>{u.name}</td>
                      <td><span style={{ fontWeight: 600 }}>{roleName}</span></td>
                      <td>
                        <span className={`status-badge ${u.status === 'ativo' ? 'success' : 'inativo'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td><small style={{ color: 'var(--text-muted)' }}>{lastLoginStr}</small></td>
                      <td>
                        <button type="button" className="btn-table-action" onClick={() => handleOpenEdit(u)}>Editar</button>
                        <button type="button" className="btn-table-action" onClick={() => handleToggleStatus(u)}>
                          {u.status === 'ativo' ? 'Inativar' : 'Ativar'}
                        </button>
                        <button type="button" className="btn-table-action delete" onClick={() => handleDelete(u)}>Excluir</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="comercial-proposals-card" style={{ marginTop: '24px' }}>
        <div className="comercial-table-header" style={{ padding: '16px 20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Logs de Auditoria</h3>
        </div>
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '24px' }}>
                    Nenhum log de auditoria registrado.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 50).map((log) => (
                  <tr key={log.id}>
                    <td>
                      <small style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleDateString('pt-BR')}{' '}
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>{log.username || log.userId || '—'}</td>
                    <td><span style={{ fontWeight: 600 }}>{log.action}</span></td>
                    <td>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
