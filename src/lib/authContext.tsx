'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type UserRole = 'resident' | 'admin' | 'photographer' | null;

interface AuthUser {
  role: UserRole;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (role: 'admin' | 'photographer', email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginAsResident: () => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clean up any legacy plaintext credentials or spoofed roles from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('bpscvs_auth_user');
      } catch {}
    }
  }, []);

  // Check authentic server-side session via HTTP-only cookie
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Session verification network error:', e);
    }

    // Check if resident guest mode was toggled locally
    if (typeof window !== 'undefined') {
      try {
        const residentMode = sessionStorage.getItem('bpscvs_resident_guest');
        if (residentMode === 'true') {
          setUser({ role: 'resident', name: 'Colony Resident', email: '' });
          setIsLoading(false);
          return;
        }
      } catch {}
    }

    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (role: 'admin' | 'photographer', email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { ok: false, error: data.error || 'Invalid credentials. Access denied.' };
      }

      if (data.success && data.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('bpscvs_resident_guest');
          } catch {}
        }
        return { ok: true };
      }
      return { ok: false, error: 'Authentication could not be completed.' };
    } catch (e) {
      console.error('Login request failed:', e);
      return { ok: false, error: 'Network error communicating with authentication service.' };
    }
  };

  const loginAsResident = () => {
    setUser({ role: 'resident', name: 'Colony Resident', email: '' });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('bpscvs_resident_guest', 'true');
      } catch {}
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API error:', e);
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('bpscvs_resident_guest');
      } catch {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsResident, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
