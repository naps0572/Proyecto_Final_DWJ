import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { downloadCsv } from '../utils/csv';

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'TECHNICIAN';
  createdAt: string;
  _count?: {
    ticketsCreated: number;
    ticketsAssigned: number;
  };
}

const ROLE_LABEL = {
  USER: 'Usuario',
  TECHNICIAN: 'Técnico'
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatCsvDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleString('es-CO');
}

export function UsersAdminPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<ManagedUser['role']>('USER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<ManagedUser[]>('/users', { token });
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const totals = useMemo(() => ({
    total: users.length,
    technicians: users.filter(item => item.role === 'TECHNICIAN').length,
    requesters: users.filter(item => item.role === 'USER').length
  }), [users]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiFetch('/users', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, email, password, role })
      });

      setName('');
      setEmail('');
      setPassword('');
      setRole('USER');
      setSuccess('Usuario creado correctamente');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(userId: number, nextRole: ManagedUser['role']) {
    setError('');
    setSuccess('');
    setUpdatingId(userId);

    try {
      await apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ role: nextRole })
      });
      setSuccess('Rol actualizado correctamente');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el rol');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleDownloadUsersCsv() {
    downloadCsv(
      'usuarios',
      [
        'ID',
        'Nombre',
        'Email',
        'Rol',
        'Tickets creados',
        'Tickets asignados',
        'Creado'
      ],
      users.map((item) => [
        item.id,
        item.name,
        item.email,
        ROLE_LABEL[item.role],
        item._count?.ticketsCreated ?? 0,
        item._count?.ticketsAssigned ?? 0,
        formatCsvDate(item.createdAt)
      ])
    );
  }

  if (user?.role !== 'TECHNICIAN') {
    return (
      <div className="centered" style={{ flexDirection: 'column', gap: '12px' }}>
        <p>No tienes permisos para administrar usuarios.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Administración de usuarios</h2>
          <p>Crea cuentas y asigna roles operativos para la mesa de ayuda</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Usuarios totales</div>
          <div className="stat-value">{totals.total}</div>
          <div className="stat-sub">Cuentas registradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Técnicos</div>
          <div className="stat-value indigo">{totals.technicians}</div>
          <div className="stat-sub">Pueden gestionar tickets y usuarios</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Solicitantes</div>
          <div className="stat-value green">{totals.requesters}</div>
          <div className="stat-sub">Pueden crear y consultar sus casos</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <h3>Crear usuario</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Contraseña inicial</label>
                  <input className="form-input" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-select" value={role} onChange={(event) => setRole(event.target.value as ManagedUser['role'])}>
                    <option value="USER">Usuario</option>
                    <option value="TECHNICIAN">Técnico</option>
                  </select>
                </div>
              </div>

              {error && <div className="alert alert-error" style={{ marginTop: '12px' }}>{error}</div>}
              {success && <div className="alert alert-success" style={{ marginTop: '12px' }}>✓ {success}</div>}

              <div className="button-row">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Roles y acceso</h3>
            <div className="card-actions">
              <span className="record-count">{users.length} cuentas</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadUsersCsv}
                disabled={loading || users.length === 0}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v7" />
                  <path d="M5 6l3 3 3-3" />
                  <path d="M3 13h10" />
                </svg>
                Descargar CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="centered" style={{ minHeight: '180px' }}>
              <div className="spinner"></div>
              Cargando usuarios...
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Tickets</th>
                    <th>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="creator-cell">
                          <div className="mini-avatar">{initials(item.name)}</div>
                          <div>
                            <span className="ticket-title-cell">{item.name}</span>
                            <span className="table-sub">{item.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className="role-select"
                          value={item.role}
                          disabled={updatingId === item.id}
                          onChange={(event) => handleRoleChange(item.id, event.target.value as ManagedUser['role'])}
                        >
                          <option value="USER">{ROLE_LABEL.USER}</option>
                          <option value="TECHNICIAN">{ROLE_LABEL.TECHNICIAN}</option>
                        </select>
                      </td>
                      <td className="record-count">
                        {item._count?.ticketsCreated ?? 0} creados · {item._count?.ticketsAssigned ?? 0} asignados
                      </td>
                      <td className="record-count">
                        {new Date(item.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
