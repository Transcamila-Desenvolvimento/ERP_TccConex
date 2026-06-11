import React, { useState, useEffect } from 'react';
import type { BankAccount, BalanceHistoryEntry } from '../../types/domain';
import { useBankAccounts, useBalanceHistory, useSyncBankData } from '../../hooks/useFinanceiroBalances';

const FinanceiroBalances: React.FC = () => {
  const { data: accounts = [] } = useBankAccounts();
  const { data: history = [] } = useBalanceHistory();
  const syncBankData = useSyncBankData();

  useEffect(() => {
    const el = document.querySelector('.content') as HTMLElement | null;
    if (!el) return;
    const prev = el.style.overflowY;
    el.style.overflowY = 'hidden';
    return () => { el.style.overflowY = prev; };
  }, []);

  // Modals visibility
  const [isNewLogOpen, setIsNewLogOpen] = useState(false);
  const [isEditLogOpen, setIsEditLogOpen] = useState(false);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);

  // Active selected account id for editing
  const [selectedAccId, setSelectedAccId] = useState<number | null>(null);
  
  // Active selected log id for editing
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  // Forms states (Add Account)
  const [addBank, setAddBank] = useState('');
  const [addAgency, setAddAgency] = useState('');
  const [addNumber, setAddNumber] = useState('');
  const [addType, setAddType] = useState('Corrente');
  const [addInitialBalance, setAddInitialBalance] = useState('');

  // Forms states (Edit Account)
  const [editBank, setEditBank] = useState('');
  const [editAgency, setEditAgency] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editType, setEditType] = useState('Corrente');
  const [editBalance, setEditBalance] = useState('');

  // Forms states (New Balance Log)
  const [logAccountId, setLogAccountId] = useState<number>(1);
  const [logDate, setLogDate] = useState('');
  const [logValue, setLogValue] = useState('');

  // Forms states (Edit Balance Log)
  const [editLogAccountId, setEditLogAccountId] = useState<number>(1);
  const [editLogDate, setEditLogDate] = useState('');
  const [editLogValue, setEditLogValue] = useState('');

  // Main Listing Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [bankFilter, setBankFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Hover States for Inline Editing (account table)
  const [hoveredAccountId, setHoveredAccountId] = useState<number | null>(null);

  useEffect(() => {
    if (accounts.length > 0 && logAccountId === 1 && !accounts.some(a => a.id === logAccountId)) {
      setLogAccountId(accounts[0].id);
    }
  }, [accounts, logAccountId]);

  useEffect(() => {
    const now = new Date();
    setLogDate(now.toISOString().split('T')[0]);
  }, []);

  const saveToStorage = (updatedAccs: BankAccount[], updatedHist: BalanceHistoryEntry[]) => {
    syncBankData.mutate({ accounts: updatedAccs, history: updatedHist });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Close modal check if clicked on backdrop
      if (target.classList.contains('search-backdrop')) {
        if (target.id === 'balances-new-log-modal') setIsNewLogOpen(false);
        if (target.id === 'balances-edit-log-modal') setIsEditLogOpen(false);
        if (target.id === 'balances-manage-accounts-modal') setIsManageAccountsOpen(false);
        if (target.id === 'balances-add-account-modal') setIsAddAccountOpen(false);
        if (target.id === 'balances-edit-account-modal') setIsEditAccountOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // 1. Add Account Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const initialBalNum = parseFloat(addInitialBalance) || 0;

    const newAcc: BankAccount = {
      id: newId,
      bank: addBank,
      agency: addAgency,
      number: addNumber,
      type: addType,
      balance: initialBalNum,
      lastUpdated: formattedDate
    };

    const newHistoryLog: BalanceHistoryEntry = {
      id: history.length ? Math.max(...history.map(h => h.id)) + 1 : 1,
      accountId: newId,
      date: now.toISOString().split('T')[0],
      bank: addBank,
      number: addNumber,
      type: addType,
      value: initialBalNum
    };

    const updatedAccs = [...accounts, newAcc];
    const updatedHist = [...history, newHistoryLog];
    saveToStorage(updatedAccs, updatedHist);
    
    setIsAddAccountOpen(false);
    // Reset form
    setAddBank('');
    setAddAgency('');
    setAddNumber('');
    setAddType('Corrente');
    setAddInitialBalance('');
    alert('Conta cadastrada com sucesso!');
  };

  // 2. Edit Account Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccId === null) return;

    const balanceNum = parseFloat(editBalance) || 0;
    const account = accounts.find(a => a.id === selectedAccId);
    const isBalanceChanged = account ? account.balance !== balanceNum : false;

    let updatedHist = [...history];
    if (isBalanceChanged && selectedAccId !== null) {
      // Find if there is any log for this account
      const accountLogs = updatedHist
        .filter(h => h.accountId === selectedAccId)
        .sort((x, y) => {
          if (x.date !== y.date) return y.date.localeCompare(x.date);
          return y.id - x.id;
        });

      if (accountLogs.length > 0) {
        // Update the latest log
        const latestLogId = accountLogs[0].id;
        updatedHist = updatedHist.map(h => {
          if (h.id === latestLogId) {
            return {
              ...h,
              value: balanceNum
            };
          }
          return h;
        });
      } else {
        // Create a new log
        const now = new Date();
        const newHistoryLog: BalanceHistoryEntry = {
          id: updatedHist.length ? Math.max(...updatedHist.map(h => h.id)) + 1 : 1,
          accountId: selectedAccId,
          date: now.toISOString().split('T')[0],
          bank: editBank,
          number: editNumber,
          type: editType,
          value: balanceNum
        };
        updatedHist.push(newHistoryLog);
      }
    }

    const updatedAccs = accounts.map(a => {
      if (a.id === selectedAccId) {
        return {
          ...a,
          bank: editBank,
          agency: editAgency,
          number: editNumber,
          type: editType,
          balance: balanceNum,
          lastUpdated: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return a;
    });

    // Update remaining log metadata (bank, number, type)
    updatedHist = updatedHist.map(h => {
      if (h.accountId === selectedAccId) {
        return {
          ...h,
          bank: editBank,
          number: editNumber,
          type: editType
        };
      }
      return h;
    });

    saveToStorage(updatedAccs, updatedHist);
    
    setIsEditAccountOpen(false);
    alert('Conta bancária atualizada!');
  };

  // Delete Account
  const handleDeleteAccount = (accId: number) => {
    const account = accounts.find(a => a.id === accId);
    if (!account) return;

    if (window.confirm(`Deseja realmente excluir permanentemente a conta ${account.bank} (CC: ${account.number})? Isso apagará também todo o histórico de lançamentos desta conta.`)) {
      const remainingAccs = accounts.filter(a => a.id !== accId);
      const remainingHist = history.filter(h => h.accountId !== accId);
      
      saveToStorage(remainingAccs, remainingHist);
      
      // Update select target default if deleted
      if (logAccountId === accId && remainingAccs.length > 0) {
        setLogAccountId(remainingAccs[0].id);
      }
      alert('Conta excluída com sucesso.');
    }
  };

  // 3. New Balance Log submit
  const handleNewLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAccountId = Number(logAccountId);
    const account = accounts.find(a => a.id === targetAccountId);
    if (!account) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const logValNum = parseFloat(logValue) || 0;

    const newHistoryLog: BalanceHistoryEntry = {
      id: history.length ? Math.max(...history.map(h => h.id)) + 1 : 1,
      accountId: targetAccountId,
      date: logDate,
      bank: account.bank,
      number: account.number,
      type: account.type,
      value: logValNum
    };

    // Update the account balance
    const updatedAccs = accounts.map(a => {
      if (a.id === targetAccountId) {
        return {
          ...a,
          balance: logValNum,
          lastUpdated: formattedDate
        };
      }
      return a;
    });

    const updatedHist = [...history, newHistoryLog];
    saveToStorage(updatedAccs, updatedHist);
    
    setLogValue('');
    setIsNewLogOpen(false);
    setCurrentPage(1);
    alert('Lançamento de saldo realizado com sucesso!');
  };

  // Open Edit Balance Log Modal
  const handleOpenEditLog = (log: BalanceHistoryEntry) => {
    setSelectedLogId(log.id);
    setEditLogAccountId(log.accountId);
    setEditLogDate(log.date);
    setEditLogValue(log.value.toString());
    setIsEditLogOpen(true);
  };

  // Edit Balance Log submit
  const handleEditLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLogId === null) return;

    const targetAccountId = Number(editLogAccountId);
    const account = accounts.find(a => a.id === targetAccountId);
    if (!account) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const logValNum = parseFloat(editLogValue) || 0;

    const previousLog = history.find(h => h.id === selectedLogId);
    const affectedAccountIds = new Set<number>();
    affectedAccountIds.add(targetAccountId);
    if (previousLog) {
      affectedAccountIds.add(previousLog.accountId);
    }

    // Update history
    const updatedHist = history.map(h => {
      if (h.id === selectedLogId) {
        return {
          ...h,
          accountId: targetAccountId,
          date: editLogDate,
          bank: account.bank,
          number: account.number,
          type: account.type,
          value: logValNum
        };
      }
      return h;
    });

    // Recalculate account balances
    const updatedAccs = accounts.map(a => {
      if (affectedAccountIds.has(a.id)) {
        const accountLogs = updatedHist
          .filter(h => h.accountId === a.id)
          .sort((x, y) => {
            if (x.date !== y.date) return y.date.localeCompare(x.date);
            return y.id - x.id;
          });

        if (accountLogs.length > 0) {
          return {
            ...a,
            balance: accountLogs[0].value,
            lastUpdated: formattedDate
          };
        } else {
          return {
            ...a,
            balance: 0,
            lastUpdated: '--/--/----'
          };
        }
      }
      return a;
    });

    saveToStorage(updatedAccs, updatedHist);
    
    setIsEditLogOpen(false);
    alert('Lançamento de saldo atualizado!');
  };

  // 4. Delete Balance Log
  const handleDeleteLog = (logId: number) => {
    const log = history.find(h => h.id === logId);
    if (!log) return;

    if (window.confirm('Deseja realmente excluir este lançamento de saldo?')) {
      const remainingLogs = history.filter(h => h.id !== logId);
      
      // Recalculate balance for that account
      const accountLogs = remainingLogs
        .filter(h => h.accountId === log.accountId)
        .sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.id - a.id;
        });

      const updatedAccs = accounts.map(a => {
        if (a.id === log.accountId) {
          if (accountLogs.length > 0) {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return {
              ...a,
              balance: accountLogs[0].value,
              lastUpdated: formattedDate
            };
          } else {
            return {
              ...a,
              balance: 0,
              lastUpdated: '--/--/----'
            };
          }
        }
        return a;
      });

      saveToStorage(updatedAccs, remainingLogs);
      alert('Lançamento removido!');
    }
  };

  // 5. Open Edit Account Modal
  const handleOpenEdit = (acc: BankAccount) => {
    setSelectedAccId(acc.id);
    setEditBank(acc.bank);
    setEditAgency(acc.agency);
    setEditNumber(acc.number);
    setEditType(acc.type);
    setEditBalance(acc.balance.toString());
    setIsEditAccountOpen(true);
  };

  // Filter main transactions history
  let filteredLogs = [...history];

  if (bankFilter !== 'Todos') {
    filteredLogs = filteredLogs.filter(h => h.bank === bankFilter);
  }

  if (typeFilter !== 'Todos') {
    filteredLogs = filteredLogs.filter(h => h.type === typeFilter);
  }

  if (searchQuery) {
    const s = searchQuery.toLowerCase().trim();
    filteredLogs = filteredLogs.filter(h => {
      const parts = h.date.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : h.date;
      return (
        h.bank.toLowerCase().includes(s) ||
        h.number.includes(s) ||
        formattedDate.includes(s) ||
        h.value.toString().includes(s)
      );
    });
  }

  // Sort logs by date desc, then ID desc
  filteredLogs.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id - a.id;
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const clampedPage = Math.min(currentPage, totalPages) || 1;

  const startIndex = (clampedPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Get distinct bank names for filter select
  const distinctBanks = Array.from(new Set(accounts.map(a => a.bank)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '4px' }}>
      {/* Header */}
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '6px', height: '22px', backgroundColor: '#118CC4' }}></div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Lançamentos de Saldos Bancários</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            type="button"
            className="reports-action-btn primary" 
            id="btn-balances-new-log" 
            style={{ backgroundColor: '#118CC4', borderColor: '#118CC4', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => {
              const now = new Date();
              setLogDate(now.toISOString().split('T')[0]);
              setLogValue('');
              if (accounts.length > 0 && !accounts.some(a => a.id === logAccountId)) {
                setLogAccountId(accounts[0].id);
              }
              setIsNewLogOpen(true);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            <span>Novo Lançamento</span>
          </button>

          <button 
            type="button"
            className="reports-action-btn secondary" 
            id="btn-balances-manage-accounts" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: '#cbd5e1' }}
            onClick={() => setIsManageAccountsOpen(true)}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Cadastrar / Editar Contas</span>
          </button>
        </div>
      </header>



      {/* Filters Toolbar */}
      <div className="reports-filters-bar" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <div className="reports-filter-left" style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="reports-search-wrapper" style={{ minWidth: '240px' }}>
            <svg className="search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Buscar por banco, conta ou valor..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="reports-select-wrapper">
            <select 
              value={bankFilter} 
              onChange={(e) => {
                setBankFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="Todos">Banco: Todos</option>
              {distinctBanks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="reports-select-wrapper">
            <select 
              value={typeFilter} 
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="Todos">Tipo de Conta: Todos</option>
              <option value="Corrente">Conta Corrente</option>
              <option value="Investimento">Conta de Investimento</option>
            </select>
          </div>
        </div>

        <div className="reports-filter-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="reports-records-count"><strong>{filteredLogs.length}</strong> Lançamentos</span>
        </div>
      </div>

      {/* Main Listing Table */}
      <div className="erp-card reports-table-card" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="erp-table reports-table">
            <thead>
              <tr>
                <th style={{ borderRight: 'none', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Data</th>
                <th style={{ borderRight: 'none', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Banco</th>
                <th style={{ borderRight: 'none', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Agência/Conta</th>
                <th style={{ borderRight: 'none', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Tipo</th>
                <th className="num" style={{ borderRight: 'none', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500, textAlign: 'right' }}>Saldo Lançado</th>
                <th style={{ borderRight: 'none', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500, width: '150px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '32px' }}>
                    Nenhum lançamento de saldo bancário cadastrado.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((h, idx) => {
                  const zebraClass = idx % 2 === 1 ? 'zebra-row' : '';
                  const parts = h.date.split('-');
                  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : h.date;

                  return (
                    <tr
                      key={h.id}
                      className={zebraClass}
                    >
                      <td style={{ borderBottom: '1px solid #f1f5f9', borderRight: 'none', fontWeight: 500 }}>{formattedDate}</td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', borderRight: 'none' }}>{h.bank}</td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', borderRight: 'none', color: '#64748b' }}>{h.number}</td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', borderRight: 'none' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 600, 
                          color: '#0076ce', 
                          backgroundColor: '#eff6ff', 
                          padding: '2px 8px', 
                          borderRadius: '4px' 
                        }}>
                          {h.type}
                        </span>
                      </td>
                      <td 
                        className="num text-end" 
                        style={{ borderBottom: '1px solid #f1f5f9', borderRight: 'none', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}
                      >
                        {h.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', borderRight: 'none', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            type="button" 
                            onClick={() => handleOpenEditLog(h)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: 'transparent',
                              color: '#64748b',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                              e.currentTarget.style.color = '#118CC4';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            <span>Editar</span>
                          </button>

                          <button 
                            type="button" 
                            onClick={() => handleDeleteLog(h.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: 'transparent',
                              color: '#64748b',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            <span>Excluir</span>
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

      {/* Pagination Controls */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '13px', color: '#475569', borderTop: '1px solid #e2e8f0', background: '#f8fafc', marginTop: '2px' }}>
        <span style={{ fontWeight: 500, marginRight: '4px' }}>
          Página <span style={{ color: '#0f172a', fontWeight: 600 }}>{clampedPage}</span> de <span style={{ color: '#0f172a', fontWeight: 600 }}>{totalPages}</span>
        </span>
        <button 
          type="button" 
          className="reports-action-btn secondary" 
          disabled={clampedPage <= 1}
          onClick={handlePrevPage}
          style={{ height: '32px', padding: '0 12px', fontSize: '12px', gap: '6px', opacity: clampedPage <= 1 ? 0.5 : 1, cursor: clampedPage <= 1 ? 'not-allowed' : 'pointer' }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Anterior
        </button>
        <button 
          type="button" 
          className="reports-action-btn secondary" 
          disabled={clampedPage >= totalPages}
          onClick={handleNextPage}
          style={{ height: '32px', padding: '0 12px', fontSize: '12px', gap: '6px', opacity: clampedPage >= totalPages ? 0.5 : 1, cursor: clampedPage >= totalPages ? 'not-allowed' : 'pointer' }}
        >
          Próximo
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* MODAL: NOVO LANÇAMENTO DE SALDO */}
      {isNewLogOpen && (
        <div className="search-backdrop" id="balances-new-log-modal" style={{ display: 'flex' }}>
          <div className="search-modal-card" style={{ width: '460px' }}>
            <div className="search-input-wrapper" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Novo Lançamento de Saldo</h3>
              <span className="search-close-key" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setIsNewLogOpen(false)}>Fechar (X)</span>
            </div>
            
            <form id="balances-new-log-form" style={{ padding: '20px 24px 24px 24px' }} onSubmit={handleNewLogSubmit}>
              {accounts.length === 0 ? (
                <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                  Por favor, cadastre uma conta bancária antes de lançar saldos.
                </div>
              ) : (
                <>
                  <div className="login-group" style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Conta Bancária</label>
                    <div className="reports-select-wrapper" style={{ width: '100%', height: '40px' }}>
                      <select 
                        required 
                        value={logAccountId}
                        onChange={(e) => setLogAccountId(Number(e.target.value))}
                        style={{ height: '100%', padding: '0 12px', width: '100%' }}
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.bank} (CC: {acc.number})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="login-group" style={{ marginBottom: '14px' }}>
                    <label htmlFor="modal-post-date" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Data do Saldo</label>
                    <input 
                      type="date" 
                      id="modal-post-date" 
                      required 
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', background: '#ffffff' }} 
                    />
                  </div>

                  <div className="login-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="modal-post-balance-value" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Saldo Lançado (R$)</label>
                    <input 
                      type="number" 
                      id="modal-post-balance-value" 
                      placeholder="Ex: 15450.00" 
                      step="0.01" 
                      required 
                      value={logValue}
                      onChange={(e) => setLogValue(e.target.value)}
                      autoComplete="off" 
                      style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                    />
                  </div>

                  <button type="submit" className="btn-login" style={{ width: '100%', height: '40px', backgroundColor: '#118CC4', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                    Gravar Lançamento
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR LANÇAMENTO DE SALDO */}
      {isEditLogOpen && (
        <div className="search-backdrop" id="balances-edit-log-modal" style={{ display: 'flex' }}>
          <div className="search-modal-card" style={{ width: '460px' }}>
            <div className="search-input-wrapper" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Editar Lançamento de Saldo</h3>
              <span className="search-close-key" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setIsEditLogOpen(false)}>Fechar (X)</span>
            </div>
            
            <form id="balances-edit-log-form" style={{ padding: '20px 24px 24px 24px' }} onSubmit={handleEditLogSubmit}>
              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Conta Bancária</label>
                <div className="reports-select-wrapper" style={{ width: '100%', height: '40px' }}>
                  <select 
                    required 
                    value={editLogAccountId}
                    onChange={(e) => setEditLogAccountId(Number(e.target.value))}
                    style={{ height: '100%', padding: '0 12px', width: '100%' }}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bank} (CC: {acc.number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="modal-edit-post-date" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Data do Saldo</label>
                <input 
                  type="date" 
                  id="modal-edit-post-date" 
                  required 
                  value={editLogDate}
                  onChange={(e) => setEditLogDate(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', background: '#ffffff' }} 
                />
              </div>

              <div className="login-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="modal-edit-post-balance-value" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Saldo Lançado (R$)</label>
                <input 
                  type="number" 
                  id="modal-edit-post-balance-value" 
                  required 
                  value={editLogValue}
                  onChange={(e) => setEditLogValue(e.target.value)}
                  autoComplete="off" 
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>

              <button type="submit" className="btn-login" style={{ width: '100%', height: '40px', backgroundColor: '#118CC4', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                Salvar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERENCIAMENTO DE CONTAS BANCÁRIAS */}
      {isManageAccountsOpen && (
        <div className="search-backdrop" id="balances-manage-accounts-modal" style={{ display: 'flex' }}>
          <div className="search-modal-card" style={{ width: '800px', maxWidth: '90vw' }}>
            <div className="search-input-wrapper" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Gerenciamento de Contas Bancárias</h3>
              <span className="search-close-key" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setIsManageAccountsOpen(false)}>Fechar (X)</span>
            </div>
            
            <div style={{ padding: '20px 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                <button 
                  type="button" 
                  className="reports-action-btn primary"
                  onClick={() => setIsAddAccountOpen(true)}
                  style={{ backgroundColor: '#118CC4', borderColor: '#118CC4', fontSize: '12px', height: '32px', padding: '0 12px' }}
                >
                  + Cadastrar Nova Conta
                </button>
              </div>

              <div className="erp-card reports-table-card" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="erp-table reports-table" style={{ fontSize: '12px', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Banco</th>
                      <th style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Agência/Conta</th>
                      <th style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500 }}>Tipo</th>
                      <th style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500, textAlign: 'right' }}>Saldo Atual</th>
                      <th style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 500, width: '220px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px' }}>
                          Nenhuma conta cadastrada.
                        </td>
                      </tr>
                    ) : (
                      accounts.map((acc) => (
                        <tr key={acc.id}>
                          <td style={{ borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{acc.bank}</td>
                          <td style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>Ag. {acc.agency} | CC: {acc.number}</td>
                          <td style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              color: '#0076ce', 
                              backgroundColor: '#eff6ff', 
                              padding: '2px 8px', 
                              borderRadius: '4px' 
                            }}>
                              {acc.type}
                            </span>
                          </td>
                          <td 
                            style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredAccountId(acc.id)}
                            onMouseLeave={() => setHoveredAccountId(null)}
                            onClick={() => handleOpenEdit(acc)}
                            title="Clique para editar esta conta e saldo"
                          >
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <span style={{ 
                                color: hoveredAccountId === acc.id ? '#118CC4' : 'inherit', 
                                textDecoration: hoveredAccountId === acc.id ? 'underline' : 'none',
                                transition: 'color 0.15s ease' 
                              }}>
                                {acc.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                              <svg 
                                width="11" 
                                height="11" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                viewBox="0 0 24 24"
                                style={{ 
                                  color: '#118CC4', 
                                  opacity: hoveredAccountId === acc.id ? 1 : 0, 
                                  transform: hoveredAccountId === acc.id ? 'scale(1)' : 'scale(0.8)',
                                  transition: 'all 0.15s ease' 
                                }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </div>
                          </td>
                          <td style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'center', padding: '6px' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                              <button 
                                type="button" 
                                onClick={() => handleOpenEdit(acc)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: 'transparent',
                                  color: '#64748b',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#eff6ff';
                                  e.currentTarget.style.color = '#118CC4';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#64748b';
                                }}
                              >
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                <span>Editar</span>
                              </button>

                              <button 
                                type="button" 
                                onClick={() => handleDeleteAccount(acc.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: 'transparent',
                                  color: '#64748b',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fef2f2';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#64748b';
                                }}
                              >
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                <span>Excluir</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR CONTA BANCÁRIA */}
      {isAddAccountOpen && (
        <div className="search-backdrop" id="balances-add-account-modal" style={{ display: 'flex', zIndex: 3100 }}>
          <div className="search-modal-card" style={{ width: '480px' }}>
            <div className="search-input-wrapper" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Cadastrar Conta Bancária</h3>
              <span className="search-close-key" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setIsAddAccountOpen(false)}>Fechar (X)</span>
            </div>
            <form id="balances-add-account-form" style={{ padding: '20px 24px 24px 24px' }} onSubmit={handleAddSubmit}>
              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="acc-bank-name" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Nome do Banco</label>
                <input 
                  type="text" 
                  id="acc-bank-name" 
                  placeholder="Ex: Banco do Brasil, Itaú, Santander" 
                  required 
                  value={addBank}
                  onChange={(e) => setAddBank(e.target.value)}
                  autoComplete="off" 
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>

              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '14px' }}>
                <div className="login-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="acc-agency" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Agência</label>
                  <input 
                    type="text" 
                    id="acc-agency" 
                    placeholder="Ex: 0229-1" 
                    required 
                    value={addAgency}
                    onChange={(e) => setAddAgency(e.target.value)}
                    autoComplete="off" 
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                  />
                </div>
                <div className="login-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="acc-number" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Número da Conta</label>
                  <input 
                    type="text" 
                    id="acc-number" 
                    placeholder="Ex: 103420-5" 
                    required 
                    value={addNumber}
                    onChange={(e) => setAddNumber(e.target.value)}
                    autoComplete="off" 
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '14px' }}>
                <div className="login-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="acc-type" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Tipo de Conta</label>
                  <div className="reports-select-wrapper" style={{ width: '100%', height: '38px' }}>
                    <select 
                      id="acc-type" 
                      value={addType}
                      onChange={(e) => setAddType(e.target.value)}
                      style={{ height: '100%', padding: '0 12px', width: '100%' }}
                    >
                      <option value="Corrente">Conta Corrente</option>
                      <option value="Investimento">Conta de Investimento</option>
                    </select>
                  </div>
                </div>
                <div className="login-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="acc-initial-balance" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Saldo Inicial (R$)</label>
                  <input 
                    type="number" 
                    id="acc-initial-balance" 
                    placeholder="Ex: 12450.75" 
                    step="0.01" 
                    required 
                    value={addInitialBalance}
                    onChange={(e) => setAddInitialBalance(e.target.value)}
                    autoComplete="off" 
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-login" style={{ marginTop: '20px', backgroundColor: '#118CC4', width: '100%', height: '40px', border: 'none', color: '#ffffff', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}>Salvar Conta</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CONTA BANCÁRIA */}
      {isEditAccountOpen && (
        <div className="search-backdrop" id="balances-edit-account-modal" style={{ display: 'flex', zIndex: 3100 }}>
          <div className="search-modal-card" style={{ width: '480px' }}>
            <div className="search-input-wrapper" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Editar Conta Bancária</h3>
              <span className="search-close-key" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setIsEditAccountOpen(false)}>Fechar (X)</span>
            </div>
            <form id="balances-edit-account-form" style={{ padding: '20px 24px 24px 24px' }} onSubmit={handleEditSubmit}>
              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="edit-acc-bank-name" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Nome do Banco</label>
                <input 
                  type="text" 
                  id="edit-acc-bank-name" 
                  required 
                  value={editBank}
                  onChange={(e) => setEditBank(e.target.value)}
                  autoComplete="off" 
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>

              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '14px' }}>
                <div className="login-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="edit-acc-agency" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Agência</label>
                  <input 
                    type="text" 
                    id="edit-acc-agency" 
                    required 
                    value={editAgency}
                    onChange={(e) => setEditAgency(e.target.value)}
                    autoComplete="off" 
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                  />
                </div>
                <div className="login-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="edit-acc-number" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Número da Conta</label>
                  <input 
                    type="text" 
                    id="edit-acc-number" 
                    required 
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    autoComplete="off" 
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="edit-acc-type" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Tipo de Conta</label>
                <div className="reports-select-wrapper" style={{ width: '100%', height: '38px' }}>
                  <select 
                    id="edit-acc-type" 
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    style={{ height: '100%', padding: '0 12px', width: '100%' }}
                  >
                    <option value="Corrente">Conta Corrente</option>
                    <option value="Investimento">Conta de Investimento</option>
                  </select>
                </div>
              </div>

              <div className="login-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="edit-acc-balance" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Saldo Atual (R$)</label>
                <input 
                  type="number" 
                  id="edit-acc-balance" 
                  step="0.01"
                  required 
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  autoComplete="off" 
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>

              <button type="submit" className="btn-login" style={{ marginTop: '20px', backgroundColor: '#118CC4', width: '100%', height: '40px', border: 'none', color: '#ffffff', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}>Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceiroBalances;
