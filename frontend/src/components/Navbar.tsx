import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
        <div className="brand-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6"/>
            <path d="M5 8l2 2 4-4"/>
          </svg>
        </div>
        <span className="brand-name">SoporteDesk</span>
      </Link>

      <div className="navbar-right">
        <ThemeToggle />
        {user ? (
          <>
            <div className="avatar-pill">
              <div className="avatar-circle">{initials}</div>
              <span>{user.name}</span>
              <span className={`badge ${user.role === 'TECHNICIAN' ? 'badge-tech' : 'badge-user'}`} style={{ fontSize: '10px' }}>
                {user.role === 'TECHNICIAN' ? 'Técnico' : 'Usuario'}
              </span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>Salir</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Ingresar</Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '13px', padding: '5px 14px' }}>Registrarse</Link>
          </>
        )}
      </div>
    </header>
  );
}
