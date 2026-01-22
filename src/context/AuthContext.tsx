// eslint-disable-next-line react-refresh/only-export-components
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@shared/types';
import { toast } from 'sonner';
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
    // Check for persisted user
    const storedUser = localStorage.getItem('pulse_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('pulse_user');
      }
    }
    setIsLoading(false);
  }, []);
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('pulse_user', JSON.stringify(userData));
    toast.success(`Welcome back, ${userData.name}!`);
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('pulse_user');
    toast.info('Logged out successfully');
  };
  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}