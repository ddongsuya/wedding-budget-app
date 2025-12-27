import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2500 }) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('show'), 100);
    const showTimer = setTimeout(() => setPhase('exit'), duration - 500);
    const completeTimer = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 safe-area-inset ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 배경 하트 파티클 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-up"
            style={{
              left: `${10 + Math.random() * 80}%`,
              bottom: '-20px',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            <Heart
              size={10 + Math.random() * 14}
              className="text-rose-200"
              fill="currentColor"
            />
          </div>
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div
        className={`relative flex flex-col items-center transition-all duration-700 ${
          phase === 'enter' ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* 로고 - 두 개의 하트 */}
        <div className="relative mb-8">
          <div className="flex items-center gap-1">
            <Heart
              size={48}
              className={`text-rose-400 transition-all duration-500 ${
                phase === 'show' ? 'animate-heartbeat' : ''
              }`}
              fill="currentColor"
            />
            <Heart
              size={48}
              className={`text-rose-500 transition-all duration-500 delay-100 ${
                phase === 'show' ? 'animate-heartbeat-delay' : ''
              }`}
              fill="currentColor"
            />
          </div>
          {/* 연결선 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-rose-300 rounded-full" />
        </div>

        {/* 앱 제목 */}
        <h1
          className={`text-4xl font-bold text-rose-500 mb-2 tracking-tight transition-all duration-500 delay-200 ${
            phase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          Needless
        </h1>
        <h2
          className={`text-3xl font-light text-rose-400 mb-4 tracking-widest transition-all duration-500 delay-300 ${
            phase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          Wedding
        </h2>

        {/* 서브 텍스트 */}
        <p
          className={`text-stone-400 text-sm transition-all duration-500 delay-400 ${
            phase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          우리만의 특별한 결혼 준비
        </p>

        {/* 로딩 바 */}
        <div
          className={`mt-10 w-32 h-1 bg-rose-100 rounded-full overflow-hidden transition-all duration-500 delay-500 ${
            phase === 'enter' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full animate-loading-bar" />
        </div>
      </div>

      {/* 하단 버전 */}
      <p
        className={`absolute bottom-8 text-stone-300 text-xs transition-all duration-500 delay-700 ${
          phase === 'enter' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        v1.0.0
      </p>

      {/* 커스텀 애니메이션 */}
      <style>{`
        @keyframes float-up {
          0% { 
            transform: translateY(0) rotate(0deg); 
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% { 
            transform: translateY(-100vh) rotate(360deg); 
            opacity: 0;
          }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
          75% { transform: scale(1.15); }
        }
        @keyframes heartbeat-delay {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.15); }
          50% { transform: scale(1); }
          75% { transform: scale(1.1); }
        }
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-float-up { animation: float-up 6s ease-in-out infinite; }
        .animate-heartbeat { animation: heartbeat 1.2s ease-in-out infinite; }
        .animate-heartbeat-delay { animation: heartbeat-delay 1.2s ease-in-out infinite 0.1s; }
        .animate-loading-bar { animation: loading-bar 2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
