import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Wallet, CheckSquare, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingStep {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  bgGradient: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    icon: <Heart className="w-12 h-12" />,
    title: "함께 준비하는 우리의 결혼",
    description: "결혼 준비의 모든 것을 한 곳에서 관리하세요.\n예산, 일정, 체크리스트까지 손쉽게!",
    bgGradient: "from-rose-400 to-pink-500",
  },
  {
    id: 2,
    icon: <Wallet className="w-12 h-12" />,
    title: "스마트한 예산 관리",
    description: "카테고리별 예산을 설정하고\n지출을 실시간으로 추적해보세요.",
    bgGradient: "from-amber-400 to-orange-500",
  },
  {
    id: 3,
    icon: <Calendar className="w-12 h-12" />,
    title: "놓치지 않는 일정 관리",
    description: "D-day까지 중요한 일정을 관리하고\n알림을 받아보세요.",
    bgGradient: "from-blue-400 to-indigo-500",
  },
  {
    id: 4,
    icon: <CheckSquare className="w-12 h-12" />,
    title: "체계적인 체크리스트",
    description: "결혼 준비에 필요한 모든 할 일을\n시기별로 정리해드려요.",
    bgGradient: "from-emerald-400 to-teal-500",
  },
];

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  const step = ONBOARDING_STEPS[currentStep];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Skip 버튼 */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-stone-500 hover:text-stone-700 text-sm font-medium"
        >
          건너뛰기
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            {/* 일러스트레이션 영역 */}
            <div className={`
              w-48 h-48 rounded-full mb-8
              bg-gradient-to-br ${step.bgGradient}
              flex items-center justify-center
              shadow-2xl shadow-rose-500/20
              relative
            `}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white"
              >
                {step.icon}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </div>

            {/* 텍스트 */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-stone-800 mb-4"
            >
              {step.title}
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-stone-500 leading-relaxed whitespace-pre-line"
            >
              {step.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 네비게이션 */}
      <div className="px-6 pb-8 space-y-6">
        {/* 도트 인디케이터 */}
        <div className="flex justify-center gap-2">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`
                h-2 rounded-full transition-all duration-300
                ${index === currentStep 
                  ? 'w-8 bg-rose-500' 
                  : 'w-2 bg-stone-200 hover:bg-stone-300'
                }
              `}
            />
          ))}
        </div>

        {/* 다음/시작 버튼 */}
        <button
          onClick={handleNext}
          className={`
            w-full py-4 rounded-2xl font-bold text-white
            flex items-center justify-center gap-2
            bg-gradient-to-r ${step.bgGradient}
            hover:shadow-lg hover:shadow-rose-500/30
            active:scale-[0.98] transition-all
          `}
        >
          {currentStep === ONBOARDING_STEPS.length - 1 ? (
            <>시작하기 <Sparkles className="w-5 h-5" /></>
          ) : (
            <>다음 <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default WelcomeOnboarding;
