import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';

// 하트 박동 로딩
export const HeartbeatLoader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <motion.div
      animate={{ 
        scale: [1, 1.2, 1, 1.2, 1],
      }}
      transition={{ 
        duration: 1,
        repeat: Infinity,
        times: [0, 0.1, 0.2, 0.3, 1],
      }}
    >
      <Heart className="w-12 h-12 text-rose-500" fill="currentColor" />
    </motion.div>
    {text && (
      <p className="mt-4 text-stone-500 text-sm">{text}</p>
    )}
  </div>
);

// 스피너 로딩
export const SpinnerLoader: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ 
  size = 'md',
  color = 'text-rose-500'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2 className={`${sizeClasses[size]} ${color} animate-spin`} />
  );
};

// 진행 바 로딩
export const ProgressLoader: React.FC<{ progress: number; text?: string }> = ({ 
  progress, 
  text 
}) => (
  <div className="w-full max-w-xs mx-auto">
    <div className="flex justify-between text-sm mb-2">
      <span className="text-stone-500">{text || '로딩 중...'}</span>
      <span className="font-medium text-rose-500">{Math.round(progress)}%</span>
    </div>
    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  </div>
);

// 도트 로딩
export const DotLoader: React.FC = () => (
  <div className="flex gap-1.5">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2.5 h-2.5 bg-rose-500 rounded-full"
        animate={{ 
          y: [0, -8, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ 
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.1,
        }}
      />
    ))}
  </div>
);

// 풀 페이지 로딩 오버레이
export const FullPageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center"
  >
    <HeartbeatLoader />
    {message && (
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-stone-600 font-medium"
      >
        {message}
      </motion.p>
    )}
  </motion.div>
);

// 버튼 내 로딩
export const ButtonLoader: React.FC = () => (
  <div className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>처리 중...</span>
  </div>
);

// 시머 스켈레톤
export const ShimmerSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative overflow-hidden bg-stone-200 rounded-xl ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

// 펄스 스켈레톤
export const PulseSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={`bg-stone-200 rounded-xl ${className}`}
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  />
);

export default {
  HeartbeatLoader,
  SpinnerLoader,
  ProgressLoader,
  DotLoader,
  FullPageLoader,
  ButtonLoader,
  ShimmerSkeleton,
  PulseSkeleton,
};
