import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { setSentryUser, clearSentryUser } from '../lib/sentry';

interface User {
  id: number;
  email: string;
  name: string;
  coupleId?: number;
  couple_id?: string | null;
  role?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authAPI.me();
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { accessToken, refreshToken, user: userData } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    
    // Sentry에 사용자 정보 설정
    setSentryUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
    });
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authAPI.register({ email, password, name });
    const { accessToken, refreshToken, user: userData } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    
    // Sentry에 사용자 정보 설정
    setSentryUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
    });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    
    // Sentry 사용자 정보 제거
    clearSentryUser();
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
