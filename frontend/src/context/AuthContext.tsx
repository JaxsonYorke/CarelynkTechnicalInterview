/**
 * Authentication context for global auth state management
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredToken, clearStoredToken, getTokenPayload } from '../utils/auth';
import { clearToken } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Context Provider
 * Initializes auth state from localStorage on mount
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = getStoredToken();
        if (storedToken) {
          const payload = getTokenPayload();
          if (payload) {
            const authUser: User = {
              id: payload.userId,
              email: payload.email,
              role: payload.role,
            };
            setUserState(authUser);
            setTokenState(storedToken);
          } else {
            // Token invalid, clear it
            clearStoredToken();
            clearToken();
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (newUser: User, newToken: string) => {
    setUserState(newUser);
    setTokenState(newToken);
    setError(null);
  };

  const logout = () => {
    setUserState(null);
    setTokenState(null);
    clearStoredToken();
    clearToken();
    setError(null);
  };

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    setUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 * @returns Auth context value
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
