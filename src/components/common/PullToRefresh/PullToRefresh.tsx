/**
 * Pull-to-Refresh 컴포넌트
 * 모바일에서 당겨서 새로고침
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { haptic } = useHaptic();

  const THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;
    if (window.scrollY > 0) {
      startY.current = 0;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
      
      if (distance >= THRESHOLD && pullDistance < THRESHOLD) {
        haptic('medium');
      }
    }
  }, [disabled, isRefreshing, pullDistance, haptic]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      haptic('success');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    startY.current = 0;
    setPullDistance(0);
  }, [disabled, isRefreshing, pullDistance, onRefresh, haptic]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 180;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull Indicator */}
      <motion.div
        className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-10"
        style={{ top: -60 }}
        animate={{ y: pullDistance > 0 || isRefreshing ? pullDistance : 0 }}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          progress >= 1 || isRefreshing ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-400'
        }`}>
          <RefreshCw
            size={20}
            className={isRefreshing ? 'animate-spin' : ''}
            style={{ transform: isRefreshing ? 'none' : `rotate(${rotation}deg)` }}
          />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{ y: pullDistance > 0 || isRefreshing ? pullDistance * 0.3 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
