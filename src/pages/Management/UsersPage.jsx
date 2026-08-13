// /src/pages/Management.jsx - Parte da UsersPage
import { useState } from "react";
import { Icon } from "../../lib/icons";
import { useSupabaseSync } from "../../hooks/useSupabaseSync";
import { ROLES } from "../../data/constants";

export function UsersPage({ users, setUsers }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: ROLES.INSPECTOR });
  const [resetting, setResetting] = useState(null);
  const { resetUserPassword, fetchUsers } = useSupabaseSync();

  const save = async () => {
    // Implementar criação de usuário via Supabase
    setShowModal(false);
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(`Enviar link de reset de senha para ${user.email}?`)) return;
    
    setResetting(user.id);
    try {
      const result = await resetUserPassword(user.email);
      if (result.success) {
        alert(`✅ Link de reset enviado para ${user.email}`);
      } else {
        alert(`❌ Erro ao enviar reset: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setResetting(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Gestão de Utilizadores</div><div className="page-sub">{users.length} utilizadores</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={13} />Novo Utilizador
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div className="user-avatar-sm">{u.avatar || u.name.charAt(0)}</div>
                    <span style={{ fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ color: "#888" }}>{u.email}</td>
                <td><span className="badge badge-progress">{u.role}</span></td>
                <td>
                  <span className={`badge ${u.active ? "badge-ok" : "badge-closed"}`}>
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleResetPassword(u)}
                      disabled={resetting === u.id}
                      title="Resetar senha"
                    >
                      <Icon name="key" size={13} />
                      {resetting === u.id ? '...' : 'Reset Senha'}
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !x.active } : x))}
                    >
                      {u.active ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal de criação... */}
    </div>
  );
}
