import { useToastContext, TOAST_DURATIONS } from '../contexts/ToastContext';

export const useToast = () => {
  const { showToast, removeToast } = useToastContext();

  return {
    toast: {
      // 성공 메시지 (Requirements 6.3)
      success: (message: string, options?: { duration?: number }) => 
        showToast('success', message, options),
      
      // 에러 메시지 with 재시도 옵션 (Requirements 6.4)
      error: (message: string, options?: { duration?: number; onRetry?: () => void }) => 
        showToast('error', message, options),
      
      // 경고 메시지
      warning: (message: string, options?: { duration?: number }) => 
        showToast('warning', message, options),
      
      // 정보 메시지
      info: (message: string, options?: { duration?: number }) => 
        showToast('info', message, options),
    },
    showToast,
    removeToast,
    // 기본 duration 값 export
    durations: TOAST_DURATIONS,
  };
};
