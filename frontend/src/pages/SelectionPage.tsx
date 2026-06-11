import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { filterActiveEnvironments, type ActiveEnvironment } from '../constants/environments';
import logoImg from '../assets/Logo_TccConex.png';

const GLOBAL_ENVIRONMENTS = ['Administração', 'Financeiro'];

const SelectionPage: React.FC = () => {
  const { user, selectEnvironmentAndFilial, logout } = useAuth();
  const navigate = useNavigate();

  const [ambiente, setAmbiente] = useState('');
  const [filial, setFilial] = useState('');
  const [allowedFiliais, setAllowedFiliais] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Allowed environments for this user
  const userEnvironments = filterActiveEnvironments(user?.environments);

  // Update allowed filiais list when environment changes
  useEffect(() => {
    if (!ambiente || GLOBAL_ENVIRONMENTS.includes(ambiente)) {
      setAllowedFiliais([]);
      setFilial('');
      return;
    }

    let branches: string[] = [];
    if (user?.roleId === '1') {
      // Admin has access to all branch offices
      branches = ['Ibiporã (Matriz)', 'Rondonópolis', 'Paranaguá'];
    } else if (user?.filiais) {
      branches = user.filiais[ambiente] || [];
    }
    
    setAllowedFiliais(branches);
    setFilial(branches[0] || '');
  }, [ambiente, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ambiente) return;
    
    const finalFilial = GLOBAL_ENVIRONMENTS.includes(ambiente) ? '' : filial;
    selectEnvironmentAndFilial(ambiente, finalFilial);
    navigate('/');
  };

  const handleProfileClick = () => {
    const roleName = user?.roleId === '1' ? 'Administrador' : 'Operador';
    alert(`Usuário: ${user?.name}\nFunção: ${roleName}`);
  };

  const getEnvCode = (env: string) => {
    if (env === 'Administração') return 'ADM';
    if (env === 'Financeiro') return 'FIN';
    if (env === 'Indicadores') return 'IND';
    return 'ERP';
  };

  const envData: { name: ActiveEnvironment; code: string; color: string; text: string }[] = [
    { name: 'Administração', code: 'ADM', color: '#ef4444', text: 'Painel Administrativo (ADM)' },
    { name: 'Financeiro', code: 'FIN', color: '#3b82f6', text: 'Módulo Financeiro (FIN)' },
    { name: 'Indicadores', code: 'IND', color: '#8b5cf6', text: 'Módulo de Indicadores (IND)' },
  ];

  const filteredEnvs = envData.filter(env =>
    userEnvironments.includes(env.name) &&
    (env.name.toLowerCase().includes(searchQuery.toLowerCase()) || env.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="login-container" id="selection-container">
      <div className="login-card">
        <div className="login-header" style={{ marginBottom: '24px' }}>
          <img src={logoImg} alt="TccConex Logo" className="login-logo" />
          <h2>Parâmetros Iniciais</h2>
          <p>Configure os parâmetros para continuar</p>
        </div>

        <form id="selection-form" onSubmit={handleSubmit}>
          {/* Nome de Usuário */}
          <div className="login-group">
            <label>Nome de Usuário</label>
            <div className="selection-input-wrapper">
              <div className="selection-input-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <input type="text" className="selection-input-value" value={user?.name || ''} readOnly />
            </div>
          </div>

          {/* Seleção de Ambiente (ERP) */}
          <div className="login-group">
            <label htmlFor="select-ambiente">Ambiente ERP</label>
            <div className="ambiente-row">
              <div className="selection-select-wrapper ambiente-select-col">
                <div className="selection-input-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4"></path>
                  </svg>
                </div>
                <select 
                  id="select-ambiente" 
                  className="selection-select" 
                  required 
                  value={ambiente}
                  onChange={(e) => setAmbiente(e.target.value)}
                >
                  <option value="" disabled>Selecione o ERP</option>
                  {userEnvironments.map((env) => (
                    <option key={env} value={env}>{env}</option>
                  ))}
                </select>
              </div>
              <button 
                type="button" 
                className="ambiente-code-btn" 
                id="btn-search-ambiente" 
                title="Pesquisar ERP"
                onClick={() => setIsSearchOpen(true)}
              >
                <span>{getEnvCode(ambiente)}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', color: '#64748b' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Filial */}
          {ambiente && !GLOBAL_ENVIRONMENTS.includes(ambiente) && (
            <div className="login-group" id="selection-filial-group">
              <label htmlFor="select-filial">Filial</label>
              <div className="selection-select-wrapper">
                <div className="selection-input-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <select 
                  id="select-filial" 
                  className="selection-select" 
                  required 
                  value={filial}
                  onChange={(e) => setFilial(e.target.value)}
                >
                  <option value="" disabled>Selecione a filial</option>
                  {allowedFiliais.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <button type="submit" className="btn-login" id="btn-confirm-selection" style={{ marginTop: '8px' }}>
            <span>Acessar Ambiente</span>
          </button>
        </form>

        <div className="selection-footer-links">
          <button type="button" className="footer-link-btn" id="btn-selection-profile" onClick={handleProfileClick}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span>Meu Perfil</span>
          </button>
          <span className="footer-link-divider">|</span>
          <button type="button" className="footer-link-btn" id="btn-back-to-login-selection" onClick={logout}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span>Encerrar sessão</span>
          </button>
        </div>

        <div className="login-footer" style={{ marginTop: '36px' }}>
          &copy; 2026 SincConex ERP - Transcamila Cargas e Armazéns Gerais Ltda
        </div>
      </div>

      {/* Command Palette Search Modal */}
      {isSearchOpen && (
        <div className="search-backdrop" id="env-search-modal" style={{ display: 'flex' }} onClick={(e) => {
          if (e.target === e.currentTarget) setIsSearchOpen(false);
        }}>
          <div className="search-modal-card">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                id="env-search-input" 
                placeholder="Pesquisar módulo ERP autorizado..." 
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <span className="search-close-key" onClick={() => setIsSearchOpen(false)}>ESC</span>
            </div>
            <div className="search-results" id="env-search-results">
              {filteredEnvs.length === 0 ? (
                <div className="search-no-results">Nenhum ambiente disponível ou autorizado para "{searchQuery}"</div>
              ) : (
                filteredEnvs.map(env => (
                  <div 
                    key={env.name}
                    className="search-item" 
                    onClick={() => {
                      setAmbiente(env.name);
                      setIsSearchOpen(false);
                    }}
                  >
                    <div className="search-item-left">
                      <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4"></path>
                      </svg>
                      <div>
                        <div className="search-item-title">{env.name}</div>
                        <div className="search-item-path">{env.text}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: env.color, background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '4px' }}>{env.code}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionPage;
