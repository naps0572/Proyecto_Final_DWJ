import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const is = (path: string) => location.pathname === path ? 'sidebar-item active' : 'sidebar-item';

  return (
    <aside className="sidebar">
      <div className="sidebar-section">General</div>

      <Link to="/" className={is('/')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="6" height="6" rx="1.5"/>
          <rect x="9" y="1" width="6" height="6" rx="1.5"/>
          <rect x="1" y="9" width="6" height="6" rx="1.5"/>
          <rect x="9" y="9" width="6" height="6" rx="1.5"/>
        </svg>
        Dashboard
      </Link>

      <Link to="/" className="sidebar-item">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="1" width="12" height="14" rx="2"/>
          <line x1="5" y1="5" x2="11" y2="5"/>
          <line x1="5" y1="8" x2="11" y2="8"/>
          <line x1="5" y1="11" x2="8" y2="11"/>
        </svg>
        {user?.role === 'TECHNICIAN' ? 'Todos los tickets' : 'Mis tickets'}
      </Link>

      <Link to="/tickets/new" className={is('/tickets/new')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6"/>
          <line x1="8" y1="5" x2="8" y2="11"/>
          <line x1="5" y1="8" x2="11" y2="8"/>
        </svg>
        Nuevo ticket
      </Link>

      {user?.role === 'TECHNICIAN' && (
        <>
          <div className="sidebar-section">Administración</div>
          <Link to="/admin/users" className={is('/admin/users')}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M2 14c0-2.2 2.7-4 6-4s6 1.8 6 4"/>
            </svg>
            Usuarios
          </Link>
          <a className="sidebar-item" href="#">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M4 4V3a1 1 0 011-1h6a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/>
            </svg>
            Categorías
          </a>
        </>
      )}
    </aside>
  );
}
