import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children, action }) => {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.05}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 100) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] z-[70] md:hidden"
          >
            {/* Handle for drag indicator */}
            <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
               <div className="w-12 h-1.5 bg-stone-200 rounded-full"></div>
            </div>

            <div className="flex-none p-4 border-b border-stone-50 flex items-center justify-between">
              <h3 className="font-bold text-lg text-stone-800">{title}</h3>
              <button onClick={onClose} className="p-2 -mr-2 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 safe-area-pb">
              {children}
            </div>

            {action && (
              <div className="flex-none p-4 border-t border-stone-50 safe-area-pb bg-white shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
                {action}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};