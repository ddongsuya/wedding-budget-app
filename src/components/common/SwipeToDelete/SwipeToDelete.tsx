/**
 * Swipe to Delete 컴포넌트
 * 리스트 아이템을 왼쪽으로 스와이프하여 삭제
 */

import React, { useState, useRef } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
  threshold?: number;
}

export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({
  children,
  onDelete,
  disabled = false,
  threshold = 100,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { haptic } = useHaptic();

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (disabled) return;

    const shouldDelete = info.offset.x < -threshold;

    if (shouldDelete) {
      haptic('warning');
      setIsDeleting(true);
      
      // 삭제 애니메이션
      await controls.start({
        x: -window.innerWidth,
        opacity: 0,
        transition: { duration: 0.3 }
      });
      
      onDelete();
    } else {
      // 원위치로 복귀
      controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 500, damping: 30 }
      });
    }
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (disabled) return;
    
    // 삭제 임계값 도달 시 햅틱
    if (info.offset.x < -threshold && info.offset.x > -(threshold + 10)) {
      haptic('light');
    }
  };

  if (isDeleting) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* 삭제 배경 */}
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6">
        <div className="flex items-center gap-2 text-white">
          <Trash2 size={20} />
          <span className="text-sm font-medium">삭제</span>
        </div>
      </div>

      {/* 스와이프 가능한 콘텐츠 */}
      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-white cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeToDelete;
