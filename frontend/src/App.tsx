import { Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NewTicketPage } from './pages/NewTicketPage';
import { RegisterPage } from './pages/RegisterPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { UsersAdminPage } from './pages/UsersAdminPage';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        {user && <Sidebar />}
        <main className="container">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/tickets/new" element={<ProtectedRoute><NewTicketPage /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><UsersAdminPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
