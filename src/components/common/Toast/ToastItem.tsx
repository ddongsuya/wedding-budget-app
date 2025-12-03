import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast } from '../../../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

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

const colors = {
  success: 'from-emerald-500 to-emerald-600',
  error: 'from-red-500 to-red-600',
  warning: 'from-amber-500 to-amber-600',
  info: 'from-blue-500 to-blue-600',
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[toast.type];

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        relative flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg
        bg-gradient-to-r ${colors[toast.type]}
        text-white backdrop-blur-sm
        min-w-[320px] max-w-[90vw] md:max-w-[400px]
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon size={22} strokeWidth={2.5} />
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium leading-snug">
        {toast.message}
      </p>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="닫기"
      >
        <X size={18} />
      </button>

      {/* Progress Bar (optional) */}
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
