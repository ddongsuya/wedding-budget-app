import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onRetry?: () => void;
}

// 일관된 표시 시간 설정 (Requirements 6.3, 6.4)
export const TOAST_DURATIONS = {
  success: 3000,  // 성공: 3초
  error: 5000,    // 에러: 5초 (더 긴 시간으로 메시지 확인 가능)
  warning: 4000,  // 경고: 4초
  info: 3000,     // 정보: 3초
} as const;

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string, options?: { duration?: number; onRetry?: () => void }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    // 타이머 정리
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    type: Toast['type'], 
    message: string, 
    options?: { duration?: number; onRetry?: () => void }
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    // 타입별 기본 duration 사용, 옵션으로 오버라이드 가능
    const duration = options?.duration ?? TOAST_DURATIONS[type];
    const newToast: Toast = { 
      id, 
      type, 
      message, 
      duration,
      onRetry: options?.onRetry 
    };

    setToasts((prev) => [...prev, newToast]);

    // 자동 제거
    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id);
      }, duration);
      timeoutRefs.current.set(id, timeout);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};
