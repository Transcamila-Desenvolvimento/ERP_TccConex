import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIndicadorKpis, useIndicadorFiliais } from '../../hooks/useIndicadores';

const KPI_ICONS = [
  <svg key="0" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>,
  <svg key="1" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125a1.125 1.125 0 001.125-1.125V9.75M8.25 4.5h8.25a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25m-11.25-9h13.5" /></svg>,
  <svg key="2" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
  <svg key="3" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>,
  <svg key="4" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" /></svg>,
  <svg key="5" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>,
];

const IndicadoresWorkspace: React.FC = () => {
  const { selectedFilial } = useAuth();
  const { data: kpis = [] } = useIndicadorKpis();
  const { data: tableData = [] } = useIndicadorFiliais();

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Painel de Indicadores
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          {selectedFilial ? `Filial: ${selectedFilial}` : 'Todas as filiais'} &mdash; Período: Junho 2026
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {kpis.map((kpi, i) => (
          <div key={kpi.label} style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              width: '40px', height: '40px',
              background: '#f1f5f9',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b5cf6'
            }}>
              {KPI_ICONS[i] ?? KPI_ICONS[0]}
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{kpi.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{kpi.label}</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', fontWeight: 600,
              color: kpi.up ? '#16a34a' : '#dc2626',
              background: kpi.up ? '#f0fdf4' : '#fef2f2',
              borderRadius: '4px',
              padding: '2px 8px',
              width: 'fit-content'
            }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                {kpi.up
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                }
              </svg>
              {kpi.change} vs mês anterior
            </div>
          </div>
        ))}
      </div>

      {/* Tabela por filial */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Desempenho por Filial — Junho 2026
          </h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Filial', 'Receita', 'Fretes', 'Toneladas', 'Atingimento de Meta'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #e2e8f0'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={row.filial} style={{ borderBottom: i < tableData.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{row.filial}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>{row.receita}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>{row.fretes}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>{row.toneladas}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 600,
                    color: parseFloat(row.meta) >= 100 ? '#16a34a' : parseFloat(row.meta) >= 90 ? '#d97706' : '#dc2626',
                    background: parseFloat(row.meta) >= 100 ? '#f0fdf4' : parseFloat(row.meta) >= 90 ? '#fffbeb' : '#fef2f2',
                    borderRadius: '4px', padding: '3px 8px'
                  }}>{row.meta}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndicadoresWorkspace;
