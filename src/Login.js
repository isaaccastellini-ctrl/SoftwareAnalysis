import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, AlertCircle, LogIn } from 'lucide-react';

const API_BASE = "http://localhost:5000/api";

function Login({ onLogin, onSwitch }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        username,
        password
      });
      {/* Estrutura inicial do banco de dados ainda sendo encabeçada. Pode haver mudanças na maneira em que os dados aqui são transmitidos. */} 
      onLogin(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Usuário ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.iconC}>C</div>
          <h1 style={styles.logoText}>CNA <span style={{color: '#E50136'}}>Finance</span> <span>| Tucuruvi</span></h1>
          <p style={styles.subtitle}>Acesse sua conta para gerenciar seus CNA$</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={styles.form}>
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
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{...styles.button, opacity: loading ? 0.7 : 1}}
          >
            <LogIn size={20} />
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <div style={styles.switchContainer}>
          <p style={styles.switchText}>Não tem uma conta?</p>
          <button type="button" onClick={onSwitch} style={styles.switchButton}>
            Criar conta agora
          </button>
        </div>
      </div>
      
      <footer style={styles.footer}>
        CNA Finance by Grupo Gambarini &copy; 2026
      </footer>

      {/* CSS Injetado para ajustes finos de tela */}
      <style>{`
        @media (max-width: 480px) {
          .login-card {
            padding: 30px 20px !important;
            border-radius: 20px !important;
          }
          .login-subtitle {
            font-size: 12px !important;
          }
          .login-input {
            font-size: 14px !important;
            padding: 12px 12px 12px 40px !important;
          }
        }
      `}</style>
    </div>
  );
}

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
    marginBottom: '8px', 
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
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
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
    marginTop: '8px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '10px' 
  },
  switchContainer: { 
    marginTop: '20px', 
    paddingTop: '15px', 
    borderTop: '1px solid #334155' 
  },
  switchText: { color: '#94a3b8', fontSize: '13px', marginBottom: '5px' },
  switchButton: { 
    background: 'none', 
    border: 'none', 
    color: '#E50136', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: '14px', 
    textDecoration: 'underline' 
  },
  footer: { marginTop: '20px', color: '#475569', fontSize: '10px', textAlign: 'center' }
};

export default Login;