import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    // Return null or a spinner while checking auth state
    return null; 
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}