import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, AUTH_TOKEN_KEY } from './api.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/api/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    setUser(response.data.user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const response = await api.post('/api/auth/signup', { name, email, password });
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    setUser(response.data.user);
  };

  const signInWithGoogle = async (credential: string) => {
    const response = await api.post('/api/auth/google', { credential });
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    setUser(response.data.user);
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
