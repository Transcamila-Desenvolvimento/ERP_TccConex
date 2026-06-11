import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoExpanded from '../assets/Logo_TccConex.png';
import logoCollapsed from '../assets/Logo_TccConex_Fechado.png';

const DashboardLayout: React.FC = () => {
  const { user, selectedEnvironment, logout, clearEnvironment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCashflowSubmenuOpen, setIsCashflowSubmenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  // Setup initials for avatar
  const [initials, setInitials] = useState('MR');
  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      const userInitials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
      setInitials(userInitials.toUpperCase());
    }
  }, [user]);

  // Escape key global listener to close command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close user profile dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-user')) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Navigate back to environment selection
  const handleChangeEnv = () => {
    clearEnvironment();
    navigate('/select-environment');
  };

  const getSystemFunctions = () => {
    const list = [
      {
        title: "Painel Geral",
        path: "Principal / Home",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        action: () => navigate('/'),
        show: true
      },
      {
        title: "Painel de Administração",
        path: "Configuração / Segurança e Usuários",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        action: () => navigate('/admin'),
        show: user?.environments?.includes('Administração')
      },
      {
        title: "Home Financeiro",
        path: "Financeiro / Dashboard Geral",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        ),
        action: () => navigate('/financeiro/home'),
        show: user?.environments?.includes('Financeiro')
      },
      {
        title: "Inclusão de Relatórios",
        path: "Financeiro / Relatórios e Impressões",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        action: () => navigate('/financeiro/reports'),
        show: user?.environments?.includes('Financeiro')
      },
      {
        title: "Saldos Bancários",
        path: "Financeiro / Contas e Conciliações",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-5m0 5H8.25m3.75 0h3.75M12 16h3.75m-7.5 0H12m-3.75 0V8.25M12 16V8.25m3.75 7.75V8.25M3 8.25h18M12 3L3 8.25h18L12 3z" />
          </svg>
        ),
        action: () => navigate('/financeiro/balances'),
        show: user?.environments?.includes('Financeiro')
      },
      {
        title: "Ajustes de Caixa",
        path: "Financeiro / Entrada e Saída Manual",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
        ),
        action: () => navigate('/financeiro/adjustments'),
        show: user?.environments?.includes('Financeiro')
      },
      {
        title: "Faturamento",
        path: "Financeiro / Notas Fiscais e Emissões",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
        action: () => navigate('/financeiro/billing'),
        show: user?.environments?.includes('Financeiro')
      },
      {
        title: "Calendário",
        path: "Financeiro / Contas a Pagar/Receber",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008H14.25V15zm0 2.25h.008v.008H14.25v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
          </svg>
        ),
        action: () => navigate('/financeiro/calendar'),
        show: user?.environments?.includes('Financeiro')
      },
      {
        title: "Painel de Indicadores",
        path: "Indicadores / KPIs e Desempenho",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm8.25-3c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zm8.25-6c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        ),
        action: () => navigate('/indicadores'),
        show: user?.environments?.includes('Indicadores')
      },
      {
        title: "Mudar de ERP",
        path: "Usuário / Seleção de Ambiente",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
        action: handleChangeEnv,
        show: true
      },
      {
        title: "Logout (Sair do ERP)",
        path: "Usuário / Sair",
        icon: (
          <svg className="search-item-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        ),
        action: logout,
        show: true
      }
    ];

    return list.filter(f => f.show);
  };

  const filteredPalette = getSystemFunctions().filter(f => 
    f.title.toLowerCase().includes(paletteQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  // Determine active route highlights
  const isRouteActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Get Breadcrumb text based on active route and environment
  const getBreadcrumbText = () => {
    const env = selectedEnvironment || 'Geral';
    const path = location.pathname;

    if (path === '/') return `${env} / Painel Geral`;
    if (path.startsWith('/admin')) return `Administração / Controle Geral`;
    if (path.startsWith('/relatorios')) return `${env} / Inclusão de Relatórios`;
    if (path.startsWith('/financeiro/home')) return `${env} / Dashboard Financeiro`;
    if (path.startsWith('/financeiro/calendar')) return `${env} / Calendário de Vencimentos`;
    if (path.startsWith('/financeiro/reports')) return `${env} / Inclusão de Relatórios`;
    if (path.startsWith('/financeiro/balances')) return `${env} / Saldos Bancários`;
    if (path.startsWith('/financeiro/adjustments')) return `${env} / Ajustes de Caixa`;
    if (path.startsWith('/financeiro/billing')) return `${env} / Faturamento`;
    if (path.startsWith('/indicadores')) return `${env} / KPIs e Desempenho`;
    
    return `${env} / Principal`;
  };

  return (
    <div className="app-container" id="app-container" style={{ display: 'flex' }}>
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} id="sidebar">
        <div className="sidebar-brand" onClick={handleChangeEnv} title="Alterar ERP / Sair">
          <img src={logoExpanded} alt="TccConex Logo" className="brand-logo logo-expanded" />
          <img src={logoCollapsed} alt="TccConex Logo Fechado" className="brand-logo logo-collapsed" />
        </div>
        
        <nav className="sidebar-nav">
          {/* General Home/Dashboard */}
          {selectedEnvironment !== 'Financeiro' && (
            <Link 
              to="/" 
              className={`nav-btn ${isRouteActive('/') ? 'active' : ''}`} 
              data-tooltip="Painel Geral"
            >
              <div className="nav-btn-left">
                <svg className="nav-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <span className="nav-text">Painel Geral</span>
              </div>
            </Link>
          )}

          {/* Admin Workspace */}
          {selectedEnvironment === 'Administração' && (
            <Link 
              to="/admin" 
              className={`nav-btn ${isRouteActive('/admin') ? 'active' : ''}`} 
              data-tooltip="Administração"
            >
              <div className="nav-btn-left">
                <svg className="nav-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span className="nav-text">Administração</span>
              </div>
            </Link>
          )}

          {/* Indicadores Workspace */}
          {selectedEnvironment === 'Indicadores' && (
            <Link
              to="/indicadores"
              className={`nav-btn ${isRouteActive('/indicadores') ? 'active' : ''}`}
              data-tooltip="Indicadores"
            >
              <div className="nav-btn-left">
                <svg className="nav-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm8.25-3c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zm8.25-6c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <span className="nav-text">Indicadores</span>
              </div>
            </Link>
          )}

          {/* Financeiro Workspace Group */}
          {selectedEnvironment === 'Financeiro' && (
            <div id="sidebar-financeiro-group" style={{ width: '100%' }}>
              {/* Home Financeiro */}
              <Link 
                to="/financeiro/home" 
                className={`nav-btn ${isRouteActive('/financeiro/home') ? 'active' : ''}`} 
                data-tooltip="Home Financeiro"
              >
                <div className="nav-btn-left">
                  <svg className="nav-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"></path>
                  </svg>
                  <span className="nav-text">Home Financeiro</span>
                </div>
              </Link>

              {/* Calendário */}
              <Link 
                to="/financeiro/calendar" 
                className={`nav-btn ${isRouteActive('/financeiro/calendar') ? 'active' : ''}`} 
                data-tooltip="Calendário"
              >
                <div className="nav-btn-left">
                  <svg className="nav-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008H14.25V15zm0 2.25h.008v.008H14.25v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z"></path>
                  </svg>
                  <span className="nav-text">Calendário</span>
                </div>
              </Link>

              {/* Fluxo de Caixa Collapsible Submenu */}
              <div className="nav-group-wrapper" id="btn-menu-financeiro-cashflow">
                <button 
                  type="button" 
                  className={`nav-btn ${isRouteActive('/financeiro/reports') || isRouteActive('/financeiro/balances') || isRouteActive('/financeiro/adjustments') || isRouteActive('/financeiro/billing') ? 'active-parent' : ''}`}
                  onClick={() => setIsCashflowSubmenuOpen(!isCashflowSubmenuOpen)}
                >
                  <div className="nav-btn-left">
                    <svg className="nav-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"></path>
                    </svg>
                    <span className="nav-text">Fluxo de caixa</span>
                  </div>
                  <svg className="chevron-submenu" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isCashflowSubmenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                <div 
                  className="submenu-container" 
                  style={{ 
                    display: isSidebarCollapsed ? undefined : 'block',
                    maxHeight: isSidebarCollapsed ? undefined : (isCashflowSubmenuOpen ? '200px' : '0px'), 
                    overflow: 'hidden', 
                    transition: 'max-height 0.25s ease' 
                  }}
                >
                  {/* Relatórios */}
                  <Link 
                    to="/financeiro/reports" 
                    className={`nav-btn sub-nav-btn ${isRouteActive('/financeiro/reports') ? 'active' : ''}`}
                  >
                    <div className="nav-btn-left">
                      <svg className="nav-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="nav-text">Inclusão de Relatórios</span>
                    </div>
                  </Link>
                  {/* Saldos Bancários */}
                  <Link 
                    to="/financeiro/balances" 
                    className={`nav-btn sub-nav-btn ${isRouteActive('/financeiro/balances') ? 'active' : ''}`}
                  >
                    <div className="nav-btn-left">
                      <svg className="nav-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-5m0 5H8.25m3.75 0h3.75M12 16h3.75m-7.5 0H12m-3.75 0V8.25M12 16V8.25m3.75 7.75V8.25M3 8.25h18M12 3L3 8.25h18L12 3z"></path>
                      </svg>
                      <span className="nav-text">Saldos Bancários</span>
                    </div>
                  </Link>
                  {/* Ajustes de caixa */}
                  <Link 
                    to="/financeiro/adjustments" 
                    className={`nav-btn sub-nav-btn ${isRouteActive('/financeiro/adjustments') ? 'active' : ''}`}
                  >
                    <div className="nav-btn-left">
                      <svg className="nav-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"></path>
                      </svg>
                      <span className="nav-text">Ajustes de caixa</span>
                    </div>
                  </Link>
                  {/* Faturamento */}
                  <Link 
                    to="/financeiro/billing" 
                    className={`nav-btn sub-nav-btn ${isRouteActive('/financeiro/billing') ? 'active' : ''}`}
                  >
                    <div className="nav-btn-left">
                      <svg className="nav-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path>
                      </svg>
                      <span className="nav-text">Faturamento</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Collapse Toggle */}
        <div className="sidebar-collapse-container" id="btn-collapse-sidebar" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          <svg className={`chevron-collapse ${isSidebarCollapsed ? 'rotated' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="app-header">
          <div className="header-breadcrumb" id="header-breadcrumb" style={{ cursor: 'pointer' }} onClick={() => { setPaletteQuery(''); setIsPaletteOpen(true); }}>
            <span id="breadcrumb-text">{getBreadcrumbText()}</span>
            <svg className="breadcrumb-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div 
            className="header-user" 
            id="btn-header-user" 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            <div className="user-avatar" id="user-avatar-initials">{initials}</div>
            <div className="user-info">
              <span className="user-name" id="user-display-name">{user?.name}</span>
              <span className="user-role" id="user-display-role">{user?.roleId === '1' ? 'Administrador' : 'Operador'}</span>
            </div>
            
            {/* User Dropdown Menu */}
            <div className={`user-dropdown ${isUserDropdownOpen ? 'show' : ''}`} id="user-dropdown">
              <div className="dropdown-item" id="btn-dropdown-env" onClick={handleChangeEnv}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span>Mudar de ERP</span>
              </div>
              <div className="dropdown-item" id="btn-dropdown-logout" onClick={logout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Logout</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="content">
          <Outlet />
        </main>
      </div>

      {/* MODAL DE BUSCA COMANDO PALETTE (BUSCA RÁPIDA) */}
      {isPaletteOpen && (
        <div 
          className="search-backdrop" 
          id="search-modal" 
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPaletteOpen(false);
          }}
        >
          <div className="search-modal-card">
            <div className="search-input-wrapper">
              <svg className="search-modal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Pesquisar funções do sistema..." 
                autoComplete="off"
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                autoFocus
              />
              <span className="search-close-key" onClick={() => setIsPaletteOpen(false)}>ESC</span>
            </div>
            <div className="search-results">
              {filteredPalette.length === 0 ? (
                <div className="search-no-results">Nenhuma função encontrada para "{paletteQuery}"</div>
              ) : (
                filteredPalette.map((f, index) => (
                  <div 
                    key={index} 
                    className="search-item"
                    onClick={() => {
                      f.action();
                      setIsPaletteOpen(false);
                    }}
                  >
                    <div className="search-item-left">
                      {f.icon}
                      <div>
                        <div className="search-item-title">{f.title}</div>
                        <div className="search-item-path">{f.path}</div>
                      </div>
                    </div>
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

export default DashboardLayout;
