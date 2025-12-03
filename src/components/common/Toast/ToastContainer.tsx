import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../contexts/ToastContext';
import { ToastItem } from './ToastItem';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastContext();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const positionClasses = isMobile
    ? 'bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)]'
    : 'top-20 left-1/2 -translate-x-1/2';

  return (
    <div
      className={`
        fixed ${positionClasses}
        z-[9999] flex flex-col gap-3
        pointer-events-none
      `}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
