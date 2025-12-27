import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2000 }) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('show'), 100);
    const showTimer = setTimeout(() => setPhase('exit'), duration - 400);
    const completeTimer = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-400 safe-area-inset ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 메인 콘텐츠 */}
      <div
        className={`flex flex-col items-center transition-all duration-500 ${
          phase === 'enter' ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* 하트 아이콘 */}
        <div className="mb-6">
          <Heart
            size={56}
            className={`text-rose-500 transition-transform duration-500 ${
              phase === 'show' ? 'animate-pulse-heart' : ''
            }`}
            fill="currentColor"
          />
        </div>

        {/* 앱 이름 */}
        <h1 className="text-2xl font-semibold text-stone-800 tracking-wide">
          Needless Wedding
        </h1>
      </div>

      {/* 커스텀 애니메이션 */}
      <style>{`
        @keyframes pulse-heart {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-pulse-heart { 
          animation: pulse-heart 1s ease-in-out infinite; 
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
