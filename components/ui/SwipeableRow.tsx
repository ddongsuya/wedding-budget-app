import React from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onEdit, onDelete, className = '' }) => {
  const controls = useAnimation();

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -80 || velocity < -500) {
      // Swiped left enough, keep open
      await controls.start({ x: -140 });
    } else {
      // Snap back
      await controls.start({ x: 0 });
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Background Actions */}
      <div className="absolute inset-0 flex justify-end">
        {onEdit && (
          <button 
            onClick={() => { controls.start({ x: 0 }); onEdit(); }}
            className="w-[70px] bg-stone-200 flex items-center justify-center text-stone-600"
          >
            <Edit2 size={20} />
          </button>
        )}
        {onDelete && (
          <button 
            onClick={() => { controls.start({ x: 0 }); onDelete(); }}
            className="w-[70px] bg-rose-500 flex items-center justify-center text-white rounded-r-2xl"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Foreground Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-white z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};