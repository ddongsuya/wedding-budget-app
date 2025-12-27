import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Trophy, PartyPopper, X, Sparkles } from 'lucide-react';

type MilestoneType = 'd100' | 'd30' | 'd7' | 'd1' | 'dday' | 'checklist50' | 'checklist100' | 'budget50';

interface MilestoneCelebrationProps {
  type: MilestoneType;
  onClose: () => void;
}

const MILESTONE_CONFIGS: Record<MilestoneType, {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  message: string;
  gradient: string;
  confettiColors: string[];
}> = {
  d100: {
    title: 'D-100 달성! 🎉',
    subtitle: '결혼까지 100일 남았어요',
    icon: <Heart className="w-16 h-16" fill="currentColor" />,
    message: '벌써 100일이에요! 남은 시간 동안 행복하게 준비해요 💕',
    gradient: 'from-rose-500 to-pink-500',
    confettiColors: ['#f43f5e', '#ec4899', '#fda4af'],
  },
  d30: {
    title: 'D-30! 한 달 남았어요',
    subtitle: '곧 특별한 날이 다가와요',
    icon: <Star className="w-16 h-16" fill="currentColor" />,
    message: '이제 정말 얼마 안 남았네요! 마지막 점검을 해볼까요?',
    gradient: 'from-amber-400 to-orange-500',
    confettiColors: ['#fbbf24', '#f97316', '#fcd34d'],
  },
  d7: {
    title: 'D-7! 일주일 남았어요',
    subtitle: '설렘이 가득한 시간',
    icon: <PartyPopper className="w-16 h-16" />,
    message: '드디어 일주일! 긴장되지만 행복한 순간이 다가오고 있어요',
    gradient: 'from-purple-500 to-indigo-500',
    confettiColors: ['#a855f7', '#6366f1', '#c4b5fd'],
  },
  d1: {
    title: 'D-1! 내일이에요!',
    subtitle: '드디어 내일!',
    icon: <Sparkles className="w-16 h-16" />,
    message: '내일이면 결혼식이에요! 오늘 푹 쉬고 내일 빛나세요 ✨',
    gradient: 'from-pink-500 to-rose-500',
    confettiColors: ['#ec4899', '#f43f5e', '#fda4af'],
  },
  dday: {
    title: '축하합니다! 🎊',
    subtitle: '오늘이 바로 그 날!',
    icon: <Trophy className="w-16 h-16" />,
    message: '결혼을 진심으로 축하드려요! 행복한 하루 되세요 💒',
    gradient: 'from-yellow-400 to-amber-500',
    confettiColors: ['#fbbf24', '#f59e0b', '#fcd34d'],
  },
  checklist50: {
    title: '체크리스트 50% 달성!',
    subtitle: '절반이나 완료했어요',
    icon: <Trophy className="w-16 h-16" />,
    message: '벌써 절반이에요! 이 속도면 완벽하게 준비할 수 있어요 💪',
    gradient: 'from-emerald-400 to-teal-500',
    confettiColors: ['#34d399', '#14b8a6', '#6ee7b7'],
  },
  checklist100: {
    title: '체크리스트 완료! 🎉',
    subtitle: '모든 준비를 마쳤어요',
    icon: <Trophy className="w-16 h-16" fill="currentColor" />,
    message: '완벽해요! 모든 준비를 마쳤어요. 이제 행복한 날만 기다려요!',
    gradient: 'from-emerald-500 to-green-600',
    confettiColors: ['#22c55e', '#16a34a', '#86efac'],
  },
  budget50: {
    title: '예산 50% 사용',
    subtitle: '예산 관리를 잘 하고 있어요',
    icon: <Star className="w-16 h-16" fill="currentColor" />,
    message: '예산의 절반을 사용했어요. 남은 예산도 현명하게 사용해요!',
    gradient: 'from-blue-400 to-indigo-500',
    confettiColors: ['#60a5fa', '#6366f1', '#93c5fd'],
  },
};

// 간단한 Confetti 컴포넌트
const Confetti: React.FC<{ colors: string[] }> = ({ colors }) => {
  const [particles] = useState(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            x: `${p.x}%`, 
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{ 
            y: '120%',
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: [1, 1, 0],
          }}
          transition={{ 
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
};

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({ type, onClose }) => {
  const config = MILESTONE_CONFIGS[type];
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* 배경 오버레이 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Confetti */}
        {showConfetti && <Confetti colors={config.confettiColors} />}

        {/* 모달 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
        >
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* 상단 그라데이션 영역 */}
          <div className={`bg-gradient-to-br ${config.gradient} px-6 pt-12 pb-16 text-white text-center`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block mb-4"
            >
              {config.icon}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-2"
            >
              {config.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80"
            >
              {config.subtitle}
            </motion.p>
          </div>

          {/* 하단 메시지 영역 */}
          <div className="px-6 py-8 text-center -mt-8 bg-white rounded-t-3xl relative">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-stone-600 mb-6"
            >
              {config.message}
            </motion.p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${config.gradient} hover:shadow-lg active:scale-[0.98] transition-all`}
            >
              확인
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MilestoneCelebration;
