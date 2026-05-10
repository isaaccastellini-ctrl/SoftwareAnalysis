import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Wallet, Send, ShieldCheck, User as UserIcon, LogOut, FileText, ChevronLeft, ChevronRight, Camera } from 'lucide-react'; 
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import Register from './Register';

const API_BASE = "https://upmost-unapproached-madilynn.ngrok-free.dev/api"; 

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const [paymentValue, setPaymentValue] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA EXTRATO ---
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const transactionsPerPage = 10;

  // --- ESTADOS PARA O AVATAR ---
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const defaultAvatar = "https://www.habbo.fr/habbo-imaging/avatarimage?size=l&figure=hr-831-61-0.hd-3092-2-0.ch-3438-110-1408.lg-3058-110-0.sh-3089-1408-0&gesture=std&action=std&direction=2&head_direction=2&headonly=0&gender=M";

  // --- MODAL CUSTOMIZADO ---
  const [customAlert, setCustomAlert] = useState({ visible: false, message: '', title: '', receiptUrl: null });

  const showAlert = (message, title = "CNA Finance", receiptUrl = null) => {
    setCustomAlert({ visible: true, message, title, receiptUrl });
  };

  const closeAlert = () => {
    setCustomAlert({ ...customAlert, visible: false, receiptUrl: null });
  };

  // --- FUNÇÃO PARA PROCESSAR O CÓDIGO DO IFRAME ---
  const generateHabboUrlFromCode = (code) => {
    if (!code || code.trim() === '') return defaultAvatar;
    let figure = code.trim();
    if (figure.includes('figure=')) {
      const urlParams = new URLSearchParams(figure.split('?')[1]);
      figure = urlParams.get('figure');
    }
    return `https://www.habbo.fr/habbo-imaging/avatarimage?size=l&figure=${figure}&gesture=std&action=std&direction=2&head_direction=2&headonly=0&gender=M`;
  };

  // --- BUSCA DE TRANSAÇÕES ---
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API_BASE}/user/transactions/${user.id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error("Erro ao buscar extrato");
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.id]);

  // --- DOWNLOAD DE COMPROVANTE ---
  const downloadReceipt = async (url) => {
    try {
      const fullUrl = API_BASE.replace('/api', '') + url;
      const response = await axios.get(fullUrl, {
        responseType: 'blob',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `comprovante_${user?.username || 'download'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar:", error);
      showAlert("Erro ao baixar o comprovante.", "Erro");
    }
  };

  // --- SALVAR AVATAR (COM IFRAME) ---
  const saveAvatar = async () => {
    if (avatarUrlInput.trim() !== '') {
      const finalUrl = generateHabboUrlFromCode(avatarUrlInput);
      try {
        await axios.post(`${API_BASE}/user/update-avatar`, {
          user_id: user.id,
          avatar_url: finalUrl
        });
        const updatedUser = { ...user, avatar: finalUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsAvatarModalOpen(false);
        setAvatarUrlInput('');
        showAlert("Visual atualizado com sucesso!", "Sucesso");
      } catch (error) {
        console.error("Erro ao salvar avatar:", error);
        showAlert("Erro ao sincronizar avatar com o servidor.", "Erro");
      }
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user || !user.id) return; 
    try {
      const response = await axios.get(`${API_BASE}/user/${user.id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.data && (response.data.balance !== user.balance || response.data.avatar !== user.avatar)) {
        const updatedUser = { ...user, balance: response.data.balance, avatar: response.data.avatar };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Erro ao sincronizar dados do usuário.");
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'user') {
      refreshUserData();
      fetchTransactions();
      const interval = setInterval(refreshUserData, 10000); 
      return () => clearInterval(interval);
    }
  }, [activeTab, user?.id, refreshUserData, fetchTransactions]);

  const handleLogout = () => {
    localStorage.removeItem('user'); 
    setUser(null);
    setIsRegistering(false);
    window.location.reload(); 
  };

  const handlePayment = async () => {
    const amount = parseFloat(paymentValue);
    if (!user || isNaN(amount) || amount <= 0) {
      showAlert("Digite um valor válido.", "Atenção");
      return;
    }
    if (user.balance < amount) {
      showAlert("Saldo insuficiente para esta transação.", "Limite Excedido");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/user/pay`, {
        user_id: user.id,
        value: amount
      });
      if (response.status === 200) {
        const updatedUser = { ...user, balance: response.data.new_balance };
        setUser(updatedUser); 
        localStorage.setItem('user', JSON.stringify(updatedUser));
        showAlert(`Pagamento de CNA$ ${amount.toFixed(2)} realizado!`, "Sucesso", response.data.receipt_url);
        setPaymentValue(''); 
        fetchTransactions();
      }
    } catch (err) {
      showAlert(err.response?.data?.error || "Erro ao processar pagamento.", "Erro");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    if (isRegistering) return <Register onSwitch={() => setIsRegistering(false)} onRegisterSuccess={() => setIsRegistering(false)} />;
    return <Login onLogin={(userData) => { setUser(userData); localStorage.setItem('user', JSON.stringify(userData)); setActiveTab('user'); }} onSwitch={() => setIsRegistering(true)} />;
  }

  const indexOfLastTrans = currentPage * transactionsPerPage;
  const indexOfFirstTrans = indexOfLastTrans - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTrans, indexOfLastTrans);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  return (
    <div style={styles.container}>
      {/* MODAL DE ALERTA */}
      {customAlert.visible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={{...styles.modalIcon, backgroundColor: customAlert.title === "Sucesso" ? "#10b981" : "#E50136"}}>
              {customAlert.title === "Sucesso" ? "✓" : "!"}
            </div>
            <h3 style={styles.modalTitle}>{customAlert.title}</h3>
            <p style={styles.modalText}>{customAlert.message}</p>
            {customAlert.receiptUrl && (
              <button onClick={() => downloadReceipt(customAlert.receiptUrl)} style={styles.pdfBtn}>
                <FileText size={16} /> Baixar Comprovante
              </button>
            )}
            <button onClick={closeAlert} style={styles.modalConfirmBtn}>OK</button>
          </div>
        </div>
      )}

      {/* MODAL HABBO MAKER (IFRAME RESTAURADO) */}
      {isAvatarModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '400px', width: '95%', padding: '20px' }}>
            <h3 style={styles.modalTitle}>Habbo Maker</h3>
            
            <iframe 
              src="https://habbomaker.com/" 
              style={{ width: '100%', height: '300px', border: '1px solid #334155', borderRadius: '12px', marginBottom: '15px' }} 
              title="Habbo Maker" 
            />

            <input 
              type="text" 
              placeholder="Cole o código da imagem aqui (ex: hd-6006-2-0.lg-5909-1410-1410)..." 
              value={avatarUrlInput} 
              onChange={(e) => setAvatarUrlInput(e.target.value)} 
              style={{ ...styles.paymentInput, fontSize: '11px', padding: '10px', height: '40px' }} 
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={saveAvatar} style={{ ...styles.payButton, height: '45px' }}>Salvar</button>
              <button onClick={() => setIsAvatarModalOpen(false)} style={{ ...styles.modalConfirmBtn, marginTop: 0, height: '45px' }}>Sair</button>
            </div>
          </div>
        </div>
      )}

      {user.role === 'admin' && (
        <nav style={styles.nav}>
          <button onClick={() => setActiveTab('user')} style={{...styles.tab, borderBottom: activeTab === 'user' ? '3px solid #E50136' : 'none'}}><UserIcon size={18} /> Minha Conta</button>
          <button onClick={() => setActiveTab('admin')} style={{...styles.tab, borderBottom: activeTab === 'admin' ? '3px solid #E50136' : 'none'}}><ShieldCheck size={18} /> Painel Admin</button>
        </nav>
      )}

      <div style={styles.topBar}>
        <div style={styles.logoContainer}>
          <div style={styles.iconC}>C</div>
          <h1 style={styles.logoText}>CNA <span style={{color: '#E50136'}}>Finance</span></h1>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={16} /> Sair</button>
      </div>

      {activeTab === 'user' ? (
        <main style={styles.mainContent}>
          <div style={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsAvatarModalOpen(true)}>
                <img 
                  src={user.avatar || defaultAvatar} 
                  alt="Avatar" 
                  style={{ width: '55px', height: '55px', borderRadius: '14px', backgroundColor: '#1e293b', objectFit: 'contain', border: '1px solid #334155' }} 
                />
                <div style={styles.cameraBadge}><Camera size={10} color="white" /></div>
              </div>
              <span style={styles.welcome}>Olá, {user.username}</span>
            </div>
            <span style={styles.badge}>{user.role.toUpperCase()}</span>
          </div>

          <div style={styles.balanceCard}>
            <p style={styles.label}>Saldo disponível</p>
            <div style={styles.balanceRow}>
              <Wallet color="#E50136" size={32} />
              <h2 style={styles.balanceValue}>CNA$ {(user.balance || 0).toFixed(2)}</h2>
            </div>
          </div>

          <div style={styles.actions}>
            <p style={styles.label}>Quanto deseja pagar?</p>
            <input type="number" placeholder="0,00" value={paymentValue} onChange={(e) => setPaymentValue(e.target.value)} style={styles.paymentInput} />
            <button onClick={handlePayment} disabled={loading} style={{...styles.payButton, opacity: loading ? 0.7 : 1}}>
              <Send size={20} /> {loading ? 'Processando...' : `Confirmar CNA$ ${paymentValue || '0,00'}`}
            </button>
          </div>

          <div style={styles.historySection}>
            <div style={styles.historyHeader}>
              <h3 style={styles.historyTitle}>Atividade Recente</h3>
              {transactions.length > 0 && <span style={styles.pageIndicator}>Página {currentPage} de {totalPages || 1}</span>}
            </div>
            <div style={styles.historyList}>
              {loadingHistory && transactions.length === 0 ? (
                <p style={{textAlign: 'center', color: '#94a3b8', fontSize: '13px'}}>Carregando histórico...</p>
              ) : currentTransactions.length > 0 ? (
                currentTransactions.map((t) => (
                  <div key={t.id} style={styles.historyItem}>
                    <div style={styles.historyItemLeft}>
                      <div style={{...styles.historyIcon, color: t.type === 'Entrada' ? '#10b981' : '#E50136'}}>
                        {t.type === 'Entrada' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p style={styles.historyDesc}>{t.type === 'Entrada' ? 'Recarga de Saldo' : 'Pagamento Realizado'}</p>
                        <p style={styles.historyDate}>{t.timestamp}</p>
                      </div>
                    </div>
                    <div style={{...styles.historyValue, color: t.type === 'Entrada' ? '#10b981' : 'white'}}>
                      {t.type === 'Entrada' ? '+' : '-'} CNA$ {t.value.toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px'}}>Nenhuma transação encontrada.</p>
              )}
            </div>
          </div>
        </main>
      ) : (
        <AdminDashboard />
      )}
      
      <footer style={styles.footer}>
        CNA Finance by Grupo Gambarini &copy; 2026 • Logado como: <strong>{user.username}</strong>
      </footer>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '450px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif', position: 'relative' },
  nav: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '25px' },
  tab: { backgroundColor: 'transparent', border: 'none', color: 'white', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  iconC: { backgroundColor: '#0f172a', color: '#E50136', width: '35px', height: '35px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', border: '2px solid #E50136' },
  logoText: { color: 'white', margin: 0, fontSize: '20px', fontWeight: '800' },
  logoutBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
  headerInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  welcome: { color: '#f8fafc', fontSize: '18px', fontWeight: '500' },
  badge: { backgroundColor: '#334155', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', color: '#cbd5e1' },
  balanceCard: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '24px', borderLeft: '6px solid #E50136', boxShadow: '0 10px 15px rgba(0,0,0,0.3)' },
  label: { color: '#94a3b8', fontSize: '13px', marginBottom: '8px' },
  balanceRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  balanceValue: { fontSize: '36px', margin: 0, fontWeight: '800', color: 'white' },
  actions: { marginTop: '30px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '20px' },
  paymentInput: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '15px', boxSizing: 'border-box', outline: 'none' },
  payButton: { width: '100%', backgroundColor: '#E50136', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  historySection: { marginTop: '30px', marginBottom: '30px' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  historyTitle: { fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 },
  pageIndicator: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  historyItem: { backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' },
  historyItemLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  historyIcon: { backgroundColor: '#0f172a', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' },
  historyDesc: { margin: 0, fontSize: '14px', color: 'white', fontWeight: '500' },
  historyDate: { margin: 0, fontSize: '11px', color: '#64748b' },
  historyValue: { fontSize: '14px', fontWeight: '700' },
  footer: { marginTop: 'auto', padding: '20px 0', textAlign: 'center', fontSize: '11px', color: '#94a3b8' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' },
  modalBox: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '28px', textAlign: 'center', width: '85%', maxWidth: '320px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  modalIcon: { color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', fontSize: '20px', fontWeight: 'bold' },
  modalTitle: { color: 'white', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700' },
  modalText: { color: '#94a3b8', fontSize: '14px', marginBottom: '25px', lineHeight: '1.4' },
  modalConfirmBtn: { backgroundColor: '#334155', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', width: '100%', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px' },
  pdfBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#E50136', color: 'white', padding: '12px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px', width: '100%', border: 'none', cursor: 'pointer' },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#E50136', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' }
};

export default App;