import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-theme">
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="brand-icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6"/>
              <path d="M5 8l2 2 4-4"/>
            </svg>
          </div>
          <span className="brand-name">SoporteDesk</span>
        </div>

        <h2>Crear cuenta</h2>
        <p className="auth-sub">Regístrate para reportar y dar seguimiento a tus tickets</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="form-input" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input className="form-input" type="email" placeholder="correo@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '14px' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px' }} disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
