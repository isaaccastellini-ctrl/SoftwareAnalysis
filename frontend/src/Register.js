import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, User, Lock, ArrowLeft, AlertCircle } from 'lucide-react';

const API_BASE = "https://localhost:5000/api";

const Register = ({ onSwitch, onRegisterSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/register`, { username, password });
      alert("Conta criada com sucesso! Agora você pode entrar.");
      onRegisterSuccess();
      {/* Criação de banco de dados local descartável para o teste visto em vídeo */} 
    } catch (error) {
      setError(error.response?.data?.error || "Erro ao registrar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.iconC}>C</div>
          <h1 style={styles.logoText}>CNA <span style={{color: '#E50136'}}>Finance</span> <span>| Tucuruvi</span></h1>
          <p style={styles.subtitle}>Cadastre-se para ganhar seus primeiros CNA$</p>
        </div>

        <form onSubmit={handleRegister} style={styles.form}>
          {error && (
            <div style={styles.errorBadge}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={styles.inputGroup}>
            <User size={20} color="#94a3b8" style={styles.inputIcon} />
            <input 
              type="text" 
              placeholder="Nome de usuário" 
              value={username}
              onChange={e => setUsername(e.target.value)} 
              style={styles.input} 
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
            <input 
              type="password" 
              placeholder="Crie uma senha forte" 
              value={password}
              onChange={e => setPassword(e.target.value)} 
              style={styles.input} 
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{...styles.button, opacity: loading ? 0.7 : 1}}
          >
            <UserPlus size={18} /> 
            {loading ? 'Criando conta...' : 'Cadastrar agora'}
          </button>

          <button type="button" onClick={onSwitch} style={styles.backBtn}>
            <ArrowLeft size={16} /> Já sou cadastrado
          </button>
        </form>
      </div>
      
      <footer style={styles.footer}>
        CNA Finance by Grupo Gambarini &copy; 2026
      </footer>

      <style>{`
        @media (max-width: 480px) {
          .register-card {
            padding: 30px 20px !important;
            border-radius: 20px !important;
          }
          .register-subtitle {
            font-size: 12px !important;
          }
          .register-input {
            font-size: 14px !important;
            padding: 12px 12px 12px 40px !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: { 
    minHeight: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#0f172a', 
    padding: '15px', 
    fontFamily: 'sans-serif',
    boxSizing: 'border-box'
  },
  card: { 
    width: '100%', 
    maxWidth: '400px', 
    backgroundColor: '#1e293b', 
    padding: '40px', 
    borderRadius: '24px', 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', 
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  logoSection: { marginBottom: '25px' },
  iconC: { 
    backgroundColor: '#0f172a', 
    color: '#E50136', 
    width: '45px', 
    height: '45px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '28px', 
    fontWeight: '900', 
    border: '2px solid #E50136', 
    margin: '0 auto 12px' 
  },
  logoText: { color: 'white', fontSize: '22px', margin: '0 0 8px 0', fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: '14px', lineHeight: '1.4' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  errorBadge: { 
    backgroundColor: 'rgba(229, 1, 54, 0.1)', 
    color: '#E50136', 
    padding: '10px', 
    borderRadius: '8px', 
    fontSize: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    marginBottom: '5px', 
    border: '1px solid #E50136',
    textAlign: 'left'
  },
  inputGroup: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%' },
  inputIcon: { position: 'absolute', left: '15px' },
  input: { 
    width: '100%', 
    padding: '14px 14px 14px 45px', 
    borderRadius: '12px', 
    border: '1px solid #334155', 
    backgroundColor: '#0f172a', 
    color: 'white', 
    fontSize: '16px', 
    outline: 'none', 
    boxSizing: 'border-box' 
  },
  button: { 
    width: '100%', 
    backgroundColor: '#E50136', 
    color: 'white', 
    border: 'none', 
    padding: '14px', 
    borderRadius: '12px', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    marginTop: '5px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '10px' 
  },
  backBtn: { 
    background: 'none', 
    border: 'none', 
    color: '#94a3b8', 
    cursor: 'pointer', 
    fontSize: '14px', 
    marginTop: '15px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '5px',
    textDecoration: 'none'
  },
  footer: { marginTop: '20px', color: '#475569', fontSize: '10px', textAlign: 'center' }
};

export default Register;