import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

interface AppSplashScreenProps {
  onComplete: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'exit'>('logo');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 800);
    const timer2 = setTimeout(() => setPhase('exit'), 1800);
    const timer3 = setTimeout(onComplete, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-500 via-rose-500 to-pink-600 flex flex-col items-center justify-center"
        >
          {/* 배경 장식 - 떠다니는 하트들 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: `${Math.random() * 100}%`, 
                  y: '110%',
                  opacity: 0.3,
                  scale: 0.5 + Math.random() * 0.5,
                }}
                animate={{ 
                  y: '-10%',
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ 
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
                className="absolute"
              >
                <Heart className="w-6 h-6 text-white/30" fill="currentColor" />
              </motion.div>
            ))}
          </div>

          {/* 로고 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              duration: 0.8 
            }}
            className="relative"
          >
            {/* 외부 링 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -inset-4 rounded-full border-2 border-white/30"
            />
            
            {/* 메인 아이콘 */}
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl shadow-rose-900/30 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Heart className="w-12 h-12 text-rose-500" fill="currentColor" />
              </motion.div>
            </div>

            {/* 반짝이 효과 */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ delay: 0.5, duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </motion.div>
          </motion.div>

          {/* 텍스트 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: phase === 'text' ? 1 : 0,
              y: phase === 'text' ? 0 : 20,
            }}
            transition={{ duration: 0.5 }}
            className="mt-8 text-center"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              Needless Wedding
            </h1>
            <p className="text-rose-100 text-sm">
              함께 준비하는 우리의 결혼
            </p>
          </motion.div>

          {/* 로딩 인디케이터 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-12"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppSplashScreen;
