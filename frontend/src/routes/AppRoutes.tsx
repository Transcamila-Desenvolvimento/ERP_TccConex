import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Pages
import LoginPage from '../pages/LoginPage';
import SelectionPage from '../pages/SelectionPage';
import DashboardLayout from '../layouts/DashboardLayout';

// Lazy-loaded Workspaces (Carregamento sob Demanda / Lazy Loading)
const DashboardWorkspace = lazy(() => import('../workspaces/Dashboard/DashboardWorkspace'));
const AdminWorkspace = lazy(() => import('../workspaces/Admin/AdminWorkspace'));
const FinanceiroWorkspace = lazy(() => import('../workspaces/Financeiro/FinanceiroWorkspace'));
const RelatoriosWorkspace = lazy(() => import('../workspaces/Relatorios/RelatoriosWorkspace'));
const IndicadoresWorkspace = lazy(() => import('../workspaces/Indicadores/IndicadoresWorkspace'));

// Simple loading indicator matching modern Prothon styling
const PageLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '80vh',
    width: '100%',
    color: '#0076ce',
    fontWeight: 500,
    fontSize: '15px',
    flexDirection: 'column',
    gap: '12px'
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid #e2e8f0',
      borderTopColor: '#0076ce',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}></div>
    <span>Carregando ambiente...</span>
  </div>
);

// Route Guard: Requires authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

// Route Guard: Requires environment selection
const EnvironmentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedEnvironment, isLoading } = useAuth();
  
  if (isLoading) return <PageLoader />;
  if (!selectedEnvironment) return <Navigate to="/select-environment" replace />;
  
  return <>{children}</>;
};

// Redirect root / dynamically to the active environment home page
const DashboardIndexRedirect: React.FC = () => {
  const { selectedEnvironment } = useAuth();
  
  if (selectedEnvironment === 'Financeiro') {
    return <Navigate to="/financeiro/home" replace />;
  }
  if (selectedEnvironment === 'Administração') {
    return <Navigate to="/admin" replace />;
  }
  if (selectedEnvironment === 'Indicadores') {
    return <Navigate to="/indicadores" replace />;
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardWorkspace />
    </Suspense>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/select-environment" 
          element={
            <ProtectedRoute>
              <SelectionPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <EnvironmentRoute>
                <DashboardLayout />
              </EnvironmentRoute>
            </ProtectedRoute>
          }
        >
          {/* Main workspace redirects to dash general or respective subviews */}
          <Route index element={<DashboardIndexRedirect />} />

          <Route path="admin" element={
            <Suspense fallback={<PageLoader />}>
              <AdminWorkspace />
            </Suspense>
          } />

          <Route path="financeiro/*" element={
            <Suspense fallback={<PageLoader />}>
              <FinanceiroWorkspace />
            </Suspense>
          } />

          <Route path="relatorios" element={
            <Suspense fallback={<PageLoader />}>
              <RelatoriosWorkspace />
            </Suspense>
          } />

          <Route path="indicadores" element={
            <Suspense fallback={<PageLoader />}>
              <IndicadoresWorkspace />
            </Suspense>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
