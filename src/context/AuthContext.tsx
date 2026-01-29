import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { User } from '@shared/types';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      const storedUser = localStorage.getItem('scotted_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          // Optimistically set user to avoid layout shift if valid
          if (mounted) setUser(parsed);
          // Validate session with backend to check for bans/updates
          try {
            const freshUser = await api<User>(`/api/users/${parsed.id}`);
            if (mounted) {
              setUser(freshUser);
              localStorage.setItem('scotted_user', JSON.stringify(freshUser));
            }
          } catch (apiError) {
            console.error('Session validation failed:', apiError);
            // If validation fails (e.g. 404 user deleted), clear session
            if (mounted) {
              localStorage.removeItem('scotted_user');
              setUser(null);
            }
          }
        } catch (e) {
          console.error('Failed to parse stored user', e);
          if (mounted) {
            localStorage.removeItem('scotted_user');
            setUser(null);
          }
        }
      }
      if (mounted) setIsLoading(false);
    };
    initAuth();
    return () => {
      mounted = false;
    };
  }, []);
  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('scotted_user', JSON.stringify(userData));
    toast.success(`Welcome back, ${userData.name}!`);
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('scotted_user');
    toast.info('Logged out successfully');
  }, []);
  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const freshUser = await api<User>(`/api/users/${user.id}`);
      setUser(freshUser);
      localStorage.setItem('scotted_user', JSON.stringify(freshUser));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [user]);
  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user
  }), [user, isLoading, login, logout, refreshUser]);
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