import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'danger',
  isLoading = false,
}) => {
  const variantStyles = {
    danger: {
      icon: <Trash2 size={24} />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: <AlertTriangle size={24} />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonBg: 'bg-amber-500 hover:bg-amber-600',
    },
    info: {
      icon: <AlertTriangle size={24} />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* 다이얼로그 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 hover:bg-stone-100 rounded-full transition-colors"
              aria-label="닫기"
            >
              <X size={18} className="text-stone-400" />
            </button>

            {/* 내용 */}
            <div className="p-6 text-center">
              {/* 아이콘 */}
              <div className={`w-14 h-14 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className={styles.iconColor}>{styles.icon}</span>
              </div>

              {/* 제목 */}
              <h3 className="text-lg font-bold text-stone-800 mb-2">{title}</h3>

              {/* 메시지 */}
              <p className="text-sm text-stone-500 leading-relaxed">{message}</p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 p-4 bg-stone-50 border-t border-stone-100">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-4 py-2.5 ${styles.buttonBg} text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    처리 중...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
