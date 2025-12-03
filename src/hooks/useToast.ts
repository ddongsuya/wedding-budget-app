import { useToastContext } from '../contexts/ToastContext';

export const useToast = () => {
  const { showToast, removeToast } = useToastContext();

  return {
    toast: {
      success: (message: string, duration?: number) => showToast('success', message, duration),
      error: (message: string, duration?: number) => showToast('error', message, duration),
      warning: (message: string, duration?: number) => showToast('warning', message, duration),
      info: (message: string, duration?: number) => showToast('info', message, duration),
    },
    showToast,
    removeToast,
  };
};
