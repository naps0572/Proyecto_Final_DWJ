import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
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

        <h2>Bienvenido de vuelta</h2>
        <p className="auth-sub">Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="form-input"
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '14px' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?{' '}
          <Link to="/register">Regístrate gratis</Link>
        </p>

        <div className="demo-box">
          <p className="demo-box-title">Cuentas de demo</p>
          <p className="record-count">Técnico: <strong>tech@demo.com</strong> / 123456</p>
          <p className="record-count">Usuario: <strong>user@demo.com</strong> / 123456</p>
        </div>
      </div>
    </div>
  );
}
