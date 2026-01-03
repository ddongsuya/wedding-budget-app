/**
 * 맨 위로 가기 버튼
 * 스크롤이 일정 이상 내려가면 나타나는 FAB
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface ScrollToTopProps {
  threshold?: number;
  bottom?: number;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  threshold = 400,
  bottom = 100 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { haptic } = useHaptic();

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    haptic('light');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToTop}
          className="fixed right-4 z-40 w-12 h-12 bg-white border border-stone-200 rounded-full shadow-lg flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:text-rose-500 transition-colors active:scale-95"
          style={{ bottom: `${bottom}px` }}
          aria-label="맨 위로 가기"
        >
          <ChevronUp size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
