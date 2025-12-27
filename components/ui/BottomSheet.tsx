import React, { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  /** Height of the sheet: 'auto' | 'half' | 'full' */
  height?: 'auto' | 'half' | 'full';
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  action,
  height = 'auto'
}) => {
  const controls = useAnimation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  
  // Calculate max height based on height prop
  const getMaxHeight = () => {
    switch (height) {
      case 'full': return '95vh';
      case 'half': return '50vh';
      default: return '85vh';
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      controls.start({ y: 0 });
      // Focus the close button when opened
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, controls]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleDragEnd = useCallback((event: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    const { offset, velocity } = info;
    // Close if dragged down more than 100px or with high velocity
    if (offset.y > 100 || velocity.y > 500) {
      controls.start({ y: '100%' }).then(onClose);
    } else {
      // Snap back to open position
      controls.start({ y: 0 });
    }
  }, [controls, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            onClick={onClose}
          />
          
          {/* Mobile Bottom Sheet */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={controls}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col z-[70] md:hidden touch-feedback"
            style={{ maxHeight: getMaxHeight() }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bottom-sheet-title"
          >
            {/* Drag Handle - larger touch target for swipe */}
            <div 
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-feedback"
              aria-label="드래그하여 닫기"
            >
               <div className="w-12 h-1.5 bg-stone-300 rounded-full hover:bg-stone-400 transition-colors"></div>
            </div>

            {/* Header */}
            <div className="flex-none px-4 pb-3 border-b border-stone-100 flex items-center justify-between">
              <h3 id="bottom-sheet-title" className="font-bold text-lg text-stone-800">{title}</h3>
              <button 
                ref={closeButtonRef}
                onClick={onClose} 
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full touch-feedback transition-colors"
                aria-label="닫기"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {children}
            </div>

            {/* Action Footer */}
            {action && (
              <div className="flex-none p-4 border-t border-stone-100 safe-area-pb-min bg-white shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
                {action}
              </div>
            )}
          </motion.div>

          {/* Desktop Modal Fallback */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:flex fixed inset-0 bg-black/50 z-[60] items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh] w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Header */}
              <div className="flex-none px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h3 id="modal-title" className="font-bold text-lg text-stone-800">{title}</h3>
                <button 
                  onClick={onClose} 
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                  aria-label="닫기"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>

              {/* Action Footer */}
              {action && (
                <div className="flex-none p-4 border-t border-stone-100 bg-white">
                  {action}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};