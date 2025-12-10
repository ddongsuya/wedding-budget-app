import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../api/auth';
import { setSentryUser, clearSentryUser } from '../lib/sentry';

interface User {
  id: number;
  email: string;
  name: string;
  coupleId?: number;
  couple_id?: string | null;
  role?: string | null;
  is_admin?: boolean;
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

// 토큰 만료 시간 파싱 (JWT에서)
const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 토큰 자동 갱신 설정
  const setupTokenRefresh = useCallback((accessToken: string) => {
    // 기존 타이머 정리
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const expiry = getTokenExpiry(accessToken);
    if (!expiry) return;

    // 만료 5분 전에 갱신 (최소 30초 후)
    const refreshTime = Math.max(expiry - Date.now() - 5 * 60 * 1000, 30 * 1000);
    
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return;

        const response = await authAPI.refresh(refreshToken);
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // 다음 갱신 설정
        setupTokenRefresh(newAccessToken);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // 갱신 실패 시 로그아웃
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    }, refreshTime);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // 토큰 만료 확인
          const expiry = getTokenExpiry(token);
          if (expiry && expiry < Date.now()) {
            // 토큰 만료됨 - 갱신 시도
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              try {
                const refreshResponse = await authAPI.refresh(refreshToken);
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
                localStorage.setItem('accessToken', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                setupTokenRefresh(newAccessToken);
              } catch {
                throw new Error('Token refresh failed');
              }
            }
          } else {
            setupTokenRefresh(token);
          }
          
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

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [setupTokenRefresh]);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { accessToken, refreshToken, user: userData } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    
    // 토큰 자동 갱신 설정
    setupTokenRefresh(accessToken);
    
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
    
    // 토큰 자동 갱신 설정
    setupTokenRefresh(accessToken);
    
    // Sentry에 사용자 정보 설정
    setSentryUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
    });
  };

  const logout = async () => {
    // 서버에 로그아웃 요청 (토큰 폐기)
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // 타이머 정리
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
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
