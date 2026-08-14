// /src/pages/Login.jsx
import { useState } from "react";
import { Icon } from "../lib/icons";
import { signIn } from "../lib/supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.error || "Email ou senha incorretos.");
      }
    } catch (err) {
      setError(err.message || "Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header com Logo */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          marginBottom: 24 
        }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 12, 
            background: "#1E2A3A", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Icon name="clipboard" size={22} style={{ color: "#fff" }} />
          </div>
          <div>
            <div className="login-logo">FIMS</div>
            <div className="login-sub">Field Inspection Management</div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="alert-bar alert-critical" style={{ marginBottom: 16 }}>
            <Icon name="alert" size={14} />
            {error}
          </div>
        )}

        {/* Campos do formulário */}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            className="form-input" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder="seu@email.com"
            disabled={loading}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <input 
            className="form-input" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        {/* Botão de login */}
        <button 
          className="btn btn-primary" 
          style={{ 
            width: "100%", 
            justifyContent: "center", 
            padding: "12px",
            fontSize: "14px",
            fontWeight: 600
          }} 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={{ 
                display: "inline-block", 
                width: 16, 
                height: 16, 
                border: "2px solid rgba(255,255,255,0.3)", 
                borderTopColor: "#fff", 
                borderRadius: "50%", 
                animation: "spin 0.8s linear infinite",
                marginRight: 8
              }} />
              Carregando...
            </>
          ) : (
            "Entrar"
          )}
        </button>

        {/* Usuários demo */}
        <div style={{ 
          marginTop: 24, 
          padding: "14px 16px", 
          background: "#F8F7F4", 
          borderRadius: 8, 
          fontSize: 12, 
          color: "#666",
          border: "1px solid #E5E7EB"
        }}>
          <div style={{ fontWeight: 600, color: "#1E2A3A", marginBottom: 6 }}>
            👤 Contatos para acesso
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px", fontSize: 11 }}>
            <div><strong>CEO:</strong> sergio@nemchem.co.mz</div>
            <div><strong>Supervisor:</strong> marcello@nemchem.co.mz</div>
            <div><strong>Supervisor:</strong> contratos@nemchem.co.mz</div>
            <div><strong>Inspetor:</strong> supervisao@nemchem.co.mz</div>
            <div><strong>Inspetor:</strong> alberto@nemchem.co.mz</div>
            <div><strong>Admin:</strong> maluane.helder@gmail.com</div>
          </div>
          <div style={{ 
            marginTop: 6, 
            fontSize: 10, 
            color: "#888",
            borderTop: "1px solid #E5E7EB",
            paddingTop: 6
          }}>
            🔑 Senha padrão: <strong>Nemchem2024!</strong>
          </div>
        </div>

        {/* Versão */}
        <div style={{ 
          marginTop: 16, 
          textAlign: "center", 
          fontSize: 10, 
          color: "#B4B2A9" 
        }}>
          FIMS v1.0.0 • Nemchem Mozambique
        </div>
      </div>

      <style>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #F8F7F4 0%, #E5E7EB 100%);
          padding: 20px;
        }

        .login-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #E5E7EB;
        }

        .login-logo {
          font-size: 22px;
          font-weight: 700;
          color: #1E2A3A;
          letter-spacing: -0.5px;
        }

        .login-sub {
          font-size: 12px;
          color: #888;
          font-weight: 400;
          margin-top: -2px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #1E2A3A;
          margin-bottom: 4px;
        }

        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #1E2A3A;
          box-shadow: 0 0 0 3px rgba(30, 42, 58, 0.1);
        }

        .form-input:disabled {
          background: #F3F4F6;
          cursor: not-allowed;
        }

        .form-input::placeholder {
          color: #B4B2A9;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #1E2A3A;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2D3A4A;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .alert-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }

        .alert-critical {
          background: #FEF2F2;
          color: #991B1B;
          border: 1px solid #FCA5A5;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 24px 20px;
          }

          .login-logo {
            font-size: 20px;
          }

          .login-sub {
            font-size: 11px;
          }

          .form-input {
            font-size: 13px;
            padding: 8px 12px;
          }

          .btn {
            font-size: 13px;
            padding: 10px 16px;
          }

          .login-page {
            padding: 12px;
          }
        }

        @media (max-width: 380px) {
          .login-card {
            padding: 16px;
          }

          .login-card > div:first-child {
            gap: 8px !important;
          }

          .login-card > div:first-child > div:first-child {
            width: 36px !important;
            height: 36px !important;
          }

          .login-card > div:first-child > div:first-child svg {
            width: 18px !important;
            height: 18px !important;
          }

          .login-logo {
            font-size: 18px;
          }

          .login-sub {
            font-size: 10px;
          }

          .form-input {
            font-size: 12px;
            padding: 6px 10px;
          }

          .btn {
            font-size: 12px;
            padding: 8px 12px;
          }

          .alert-bar {
            font-size: 12px;
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
}
