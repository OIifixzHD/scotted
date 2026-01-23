import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from '@shared/types';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('pulse_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          // Optimistically set user to avoid layout shift if valid
          setUser(parsed);
          // Validate session with backend to check for bans/updates
          try {
            const freshUser = await api<User>(`/api/users/${parsed.id}`);
            setUser(freshUser);
            localStorage.setItem('pulse_user', JSON.stringify(freshUser));
          } catch (apiError) {
            console.error('Session validation failed:', apiError);
            // If the user doesn't exist anymore or error is critical (e.g. 404), clear session
            // We assume 404 means user deleted. 
            // Note: If network fails, we might want to keep local session, but for security hardening
            // we will force logout on validation failure to prevent stale banned users from accessing.
            // Ideally we'd distinguish network error vs 404, but api-client throws generic Error.
            // For this phase, we prioritize security.
            localStorage.removeItem('pulse_user');
            setUser(null);
          }
        } catch (e) {
          console.error('Failed to parse stored user', e);
          localStorage.removeItem('pulse_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);
  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('pulse_user', JSON.stringify(userData));
    toast.success(`Welcome back, ${userData.name}!`);
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pulse_user');
    toast.info('Logged out successfully');
  }, []);
  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  }), [user, isLoading, login, logout]);
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}