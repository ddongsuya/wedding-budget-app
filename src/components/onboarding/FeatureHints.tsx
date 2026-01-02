import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';

interface Hint {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const FEATURE_HINTS: Hint[] = [
  {
    id: 'fab-button',
    targetSelector: '[data-hint="fab-button"]',
    title: '빠른 추가',
    description: '이 버튼을 눌러 지출, 일정, 식장을 빠르게 추가하세요!',
    position: 'top',
  },
  {
    id: 'budget-card',
    targetSelector: '[data-hint="budget-summary"]',
    title: '예산 현황',
    description: '탭하면 상세한 예산 관리 페이지로 이동해요',
    position: 'bottom',
  },
  {
    id: 'dday-counter',
    targetSelector: '[data-hint="dday-counter"]',
    title: 'D-day 카운터',
    description: '결혼까지 남은 날을 확인하세요. 설정에서 날짜를 변경할 수 있어요!',
    position: 'bottom',
  },
  {
    id: 'bottom-nav',
    targetSelector: '[data-hint="bottom-nav"]',
    title: '메뉴 네비게이션',
    description: '하단 메뉴에서 예산, 체크리스트, 일정 등을 관리할 수 있어요',
    position: 'top',
  },
];

interface FeatureHintsProps {
  onComplete: () => void;
}

export const FeatureHints: React.FC<FeatureHintsProps> = ({ onComplete }) => {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const currentHint = FEATURE_HINTS[currentHintIndex];

  const updateTargetRect = useCallback(() => {
    if (currentHint) {
      const target = document.querySelector(currentHint.targetSelector);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // 타겟을 찾지 못하면 다음 힌트로
        if (currentHintIndex < FEATURE_HINTS.length - 1) {
          setCurrentHintIndex(prev => prev + 1);
        } else {
          onComplete();
        }
      }
    }
  }, [currentHint, currentHintIndex, onComplete]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentHintIndex < FEATURE_HINTS.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    } else {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  if (!currentHint || !targetRect || !isVisible) return null;

  const getTooltipPosition = () => {
    const padding = 16;
    const tooltipWidth = 280;
    
    switch (currentHint.position) {
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - tooltipWidth - padding)),
        };
      case 'top':
        return {
          top: targetRect.top - 140,
          left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - tooltipWidth - padding)),
        };
      default:
        return {
          top: targetRect.bottom + padding,
          left: Math.max(padding, targetRect.left),
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* 오버레이 with 스포트라이트 */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.7)"
            mask="url(#spotlight)"
          />
        </svg>

        {/* 툴팁 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHint.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bg-white rounded-2xl p-4 shadow-2xl z-10"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              maxWidth: 280,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-stone-800 mb-1">{currentHint.title}</h4>
                <p className="text-sm text-stone-500">{currentHint.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
              <span className="text-xs text-stone-400">
                {currentHintIndex + 1} / {FEATURE_HINTS.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700"
                >
                  건너뛰기
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600"
                >
                  {currentHintIndex === FEATURE_HINTS.length - 1 ? '완료' : '다음'}
                </button>
              </div>
            </div>

            {/* 화살표 */}
            <div 
              className={`
                absolute w-4 h-4 bg-white transform rotate-45
                ${currentHint.position === 'bottom' ? '-top-2 left-8' : '-bottom-2 left-8'}
              `}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

export default FeatureHints;
