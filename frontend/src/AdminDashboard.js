import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Users, RefreshCw, AlertCircle, Database, ShieldCheck, Plus, Minus, Search, Download } from 'lucide-react';

const API_BASE = "https://upmost-unapproached-madilynn.ngrok-free.dev/api";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [amounts, setAmounts] = useState({});

  const adminConfig = {
  headers: { 
    'X-Admin-Token': 'CNA_KEY_2026_SEGURA',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true' // Isso é o que libera o ngrok para o Axios
  }
};

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/admin/users`, adminConfig);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (err) {
      setError('Acesso negado ou erro no servidor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const downloadBackup = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/export-db`, adminConfig);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `backup_cna_finance_${new Date().toLocaleDateString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      alert("Erro ao gerar backup.");
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (userId, value) => {
    setAmounts({ ...amounts, [userId]: value });
  };

  const handleUpdateBalance = async (userId, type) => {
    const value = parseFloat(amounts[userId]);
    if (!value || value <= 0) {
      alert("Digite um valor válido.");
      return;
    }
    const finalAmount = type === 'add' ? value : -value;
    try {
      await axios.post(`${API_BASE}/admin/update-balance`, {
        user_id: userId,
        amount: finalAmount
      }, adminConfig);
      handleInputChange(userId, ''); 
      fetchUsers(); 
    } catch (err) {
      alert("Erro ao atualizar saldo.");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.titleGroup}>
          <ShieldCheck color="#E50136" size={24} />
          <h2 style={styles.title}>Painel Administrativo</h2>
        </div>
        <button onClick={fetchUsers} style={styles.refreshBtn} disabled={loading}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span className="hide-mobile">{loading ? '...' : 'Sincronizar'}</span>
        </button>
      </header>

      <div style={styles.searchContainer}>
        <Search size={18} color="#94a3b8" style={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar aluno..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <Users size={20} color="#94a3b8" />
          <div>
            <p style={styles.statLabel}>Contas</p>
            <p style={styles.statValue}>{users.length}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <Database size={20} color="#94a3b8" />
          <div>
            <p style={styles.statLabel}>Liquidez</p>
            <p style={styles.statValue}>
              CNA$ {users.reduce((acc, u) => acc + (u.balance || 0), 0).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      <button onClick={downloadBackup} style={styles.backupBtn}>
        <Download size={16} /> Exportar JSON
      </button>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Usuário</th>
              <th style={styles.th}>Patrimônio</th>
              <th style={{...styles.th, textAlign: 'center'}}>Ajuste</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={{fontWeight: 'bold', color: 'white'}}>{u.username}</div>
                  <div style={{fontSize: '9px', color: '#64748b'}}>{u.role.toUpperCase()}</div>
                </td>
                <td style={{...styles.td, color: '#10b981', fontWeight: '800'}}>
                  ${(u.balance || 0).toFixed(2)}
                </td>
                <td style={{...styles.td, textAlign: 'center'}}>
                  <div style={styles.actionGroup}>
                    <input 
                      type="number"
                      placeholder="0"
                      value={amounts[u.id] || ''}
                      onChange={(e) => handleInputChange(u.id, e.target.value)}
                      style={styles.inputAmount}
                    />
                    <div style={styles.btnGroup}>
                        <button onClick={() => handleUpdateBalance(u.id, 'rem')} style={styles.btnMinus}><Minus size={12} /></button>
                        <button onClick={() => handleUpdateBalance(u.id, 'add')} style={styles.btnPlus}><Plus size={12} /></button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @media (max-width: 600px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { marginTop: '10px', padding: '0 5px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  title: { fontSize: '16px', margin: 0, color: 'white', fontWeight: '800' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  searchContainer: { position: 'relative', marginBottom: '15px', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px' },
  searchInput: { width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', padding: '10px 10px 10px 35px', borderRadius: '10px', outline: 'none', fontSize: '14px' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' },
  statCard: { backgroundColor: '#1e293b', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #334155' },
  statLabel: { color: '#94a3b8', fontSize: '9px', margin: 0, textTransform: 'uppercase' },
  statValue: { color: 'white', fontSize: '14px', fontWeight: 'bold', margin: 0 },
  backupBtn: { width: '100%', backgroundColor: '#334155', color: '#f8fafc', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: '600' },
  errorBox: { backgroundColor: 'rgba(229, 1, 54, 0.1)', color: '#E50136', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontSize: '12px' },
  
  // AJUSTES PARA MOBILE (TABELA)
  tableContainer: { 
    backgroundColor: '#1e293b', 
    borderRadius: '15px', 
    border: '1px solid #334155', 
    overflowX: 'auto', // Permite rolagem lateral se necessário
    WebkitOverflowScrolling: 'touch' 
  },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '320px' },
  th: { textAlign: 'left', padding: '12px 8px', backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '10px' },
  tr: { borderBottom: '1px solid #334155' },
  td: { padding: '12px 8px', fontSize: '13px' },
  
  actionGroup: { display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', flexWrap: 'nowrap' },
  btnGroup: { display: 'flex', gap: '4px', alignItems: 'center' },
  inputAmount: { width: '40px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', padding: '6px 2px', borderRadius: '6px', textAlign: 'center', fontSize: '12px' },
  btnPlus: { backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer' },
  btnMinus: { backgroundColor: '#E50136', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer' }
};

export default AdminDashboard;