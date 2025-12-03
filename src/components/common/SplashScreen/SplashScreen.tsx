import React, { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2500 }) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    // 진입 애니메이션
    const enterTimer = setTimeout(() => setPhase('show'), 100);
    
    // 표시 후 퇴장
    const showTimer = setTimeout(() => setPhase('exit'), duration - 500);
    
    // 완료 콜백
    const completeTimer = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 배경 파티클 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Heart
              size={12 + Math.random() * 16}
              className="text-white/20"
              fill="currentColor"
            />
          </div>
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div
        className={`relative flex flex-col items-center transition-all duration-700 ${
          phase === 'enter' ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* 로고 아이콘 */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping">
            <Heart size={80} className="text-white/30" fill="currentColor" />
          </div>
          <div className="relative animate-pulse-slow">
            <Heart size={80} className="text-white drop-shadow-lg" fill="currentColor" />
          </div>
          <Sparkles
            size={24}
            className="absolute -top-2 -right-2 text-yellow-300 animate-sparkle"
          />
        </div>

        {/* 앱 이름 */}
        <h1
          className={`text-3xl font-bold text-white mb-2 tracking-wide transition-all duration-500 delay-200 ${
            phase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          우리의 결혼 준비
        </h1>

        {/* 서브 텍스트 */}
        <p
          className={`text-white/80 text-sm transition-all duration-500 delay-300 ${
            phase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          함께 만들어가는 특별한 순간 💕
        </p>

        {/* 로딩 인디케이터 */}
        <div
          className={`mt-8 flex gap-2 transition-all duration-500 delay-500 ${
            phase === 'enter' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* 하단 텍스트 */}
      <p
        className={`absolute bottom-8 text-white/60 text-xs transition-all duration-500 delay-700 ${
          phase === 'enter' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        Wedding Budget Planner
      </p>

      {/* 커스텀 애니메이션 스타일 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(15deg); opacity: 0.8; }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 1.5s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
