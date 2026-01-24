'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  loginId: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  signup: (loginId: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user && !!token;

  /**
   * Refresh user data from /api/auth/me
   * Called on app boot if token exists
   */
  const refreshMe = async () => {
    try {
      const response = await apiFetch<{ user: User }>('/api/auth/me');
      if (response.success && response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      // If /me fails, clear token and user
      console.error('Failed to refresh user:', error);
      localStorage.removeItem('ecoflow_token');
      setToken(null);
      setUser(null);
    }
  };

  /**
   * App boot hydration: check for existing token and refresh user
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ecoflow_token');
      if (storedToken) {
        setToken(storedToken);
        await refreshMe();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login with loginId and password
   */
  const login = async (loginId: string, password: string) => {
    try {
      const response = await apiFetch<{ user: User; token: string }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: { loginId, password },
          auth: false,
        }
      );

      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        // Store token
        localStorage.setItem('ecoflow_token', authToken);
        setToken(authToken);
        setUser(userData);

        // Navigate to dashboard
        router.push('/');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Signup with loginId, name, email, and password
   */
  const signup = async (loginId: string, name: string, email: string, password: string) => {
    try {
      const response = await apiFetch<{ user: User; token: string }>(
        '/api/auth/signup',
        {
          method: 'POST',
          body: { loginId, name, email, password },
          auth: false,
        }
      );

      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        // Store token
        localStorage.setItem('ecoflow_token', authToken);
        setToken(authToken);
        setUser(userData);

        // Navigate to dashboard
        router.push('/');
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout: clear token and user, navigate to login
   */
  const logout = () => {
    localStorage.removeItem('ecoflow_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
