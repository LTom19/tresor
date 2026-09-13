import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearAuthStorage } from '../api/client';

interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function restoreUser(): User | null {
  const raw = localStorage.getItem('tresor-user');
  if (!raw) {
    clearAuthStorage();
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (typeof parsed.id !== 'string' || typeof parsed.email !== 'string') throw new Error();
    return { id: parsed.id, email: parsed.email };
  } catch {
    clearAuthStorage();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(restoreUser);
  const [loading, setLoading] = useState(false);

  const persistUser = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem('tresor-user', JSON.stringify(u));
    else localStorage.removeItem('tresor-user');
  };

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      clearAuthStorage();
      persistUser(res.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.register(email, password);
      clearAuthStorage();
      persistUser(res.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    void api.logout().catch(() => undefined);
    clearAuthStorage();
    persistUser(null);
  }, []);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener('tresor-auth-expired', expire);
    return () => window.removeEventListener('tresor-auth-expired', expire);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
