'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department: string;
    jobPosition: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await api.get<User>('/auth/me');
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        localStorage.removeItem('accessToken');
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ user: User; accessToken: string }>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      setUser(response.data.user);
      return { success: true };
    }

    return { success: false, error: response.error || 'Login failed' };
  };

  const register = async (email: string, password: string) => {
    const response = await api.post<{ user: User; accessToken: string }>('/auth/register', {
      email,
      password,
    });

    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      setUser(response.data.user);
      return { success: true };
    }

    return { success: false, error: response.error || 'Registration failed' };
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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
