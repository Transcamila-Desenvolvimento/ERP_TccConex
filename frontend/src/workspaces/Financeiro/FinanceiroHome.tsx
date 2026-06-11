import React from 'react';

const FinanceiroHome: React.FC = () => {
  return (
    <section id="financeiro-home-view" className="view active" style={{ display: 'block' }}>
      <header className="view-header">
        <h1>Home Financeiro</h1>
        <p>Ambiente não configurado para esta filial ou em desenvolvimento.</p>
      </header>
      <div className="erp-card" style={{ marginTop: '20px', fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 20px' }}>
        Aguardando inicialização do módulo financeiro.
      </div>
    </section>
  );
};

export default FinanceiroHome;
