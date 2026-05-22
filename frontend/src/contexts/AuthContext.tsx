import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'TECHNICIAN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await apiFetch<User>('/auth/me', { token });
        setUser(currentUser);
      } catch {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [token]);

  async function login(email: string, password: string) {
    const result = await apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem('token', result.token);
    setToken(result.token);
    setUser(result.user);
  }

  async function register(name: string, email: string, password: string) {
    const result = await apiFetch<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    localStorage.setItem('token', result.token);
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
