import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, RotateCcw } from 'lucide-react';
import { Toast } from '../../../contexts/ToastContext';
import { motion } from 'framer-motion';

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// 일관된 색상 스타일 (Requirements 6.3, 6.4)
const colors = {
  success: 'from-emerald-500 to-emerald-600',
  error: 'from-red-500 to-red-600',
  warning: 'from-amber-500 to-amber-600',
  info: 'from-blue-500 to-blue-600',
};

// 접근성을 위한 aria-live 설정
const ariaLive = {
  success: 'polite' as const,
  error: 'assertive' as const,
  warning: 'assertive' as const,
  info: 'polite' as const,
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const Icon = icons[toast.type];

  const handleClose = () => {
    onRemove(toast.id);
  };

  const handleRetry = async () => {
    if (toast.onRetry && !isRetrying) {
      setIsRetrying(true);
      try {
        await toast.onRetry();
      } finally {
        setIsRetrying(false);
        handleClose();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      role="alert"
      aria-live={ariaLive[toast.type]}
      className={`
        relative flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg
        bg-gradient-to-r ${colors[toast.type]}
        text-white backdrop-blur-sm
        min-w-[320px] max-w-[90vw] md:max-w-[400px]
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon size={22} strokeWidth={2.5} aria-hidden="true" />
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium leading-snug">
        {toast.message}
      </p>

      {/* Retry Button (에러 토스트에서 onRetry가 있을 때만 표시) */}
      {toast.type === 'error' && toast.onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg 
                     bg-white/20 hover:bg-white/30 transition-colors
                     text-xs font-medium disabled:opacity-50"
          aria-label="다시 시도"
        >
          <RotateCcw size={14} className={isRetrying ? 'animate-spin' : ''} />
          <span>다시 시도</span>
        </button>
      )}

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="닫기"
      >
        <X size={18} />
      </button>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-xl"
        />
      )}
    </motion.div>
  );
};
