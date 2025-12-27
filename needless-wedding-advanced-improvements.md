# Needless Wedding 고급 기능 개선안

## 📋 목차
1. [온보딩 개선](#1-온보딩-개선)
2. [위젯 기능](#2-위젯-기능)
3. [로딩 애니메이션](#3-로딩-애니메이션)
4. [추가 디자인 개선](#4-추가-디자인-개선)

---

## 1. 온보딩 개선

### 현재 문제
- 첫 사용자가 어디서부터 시작해야 할지 모름
- 기능 설명이 없음
- 초기 설정 가이드 부재

### 개선안 A: 웰컴 슬라이드 온보딩

```tsx
// components/onboarding/WelcomeOnboarding.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Wallet, CheckSquare, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingStep {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  illustration: string;
  bgGradient: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    icon: <Heart className="w-8 h-8" />,
    title: "함께 준비하는 우리의 결혼",
    description: "결혼 준비의 모든 것을 한 곳에서 관리하세요.\n예산, 일정, 체크리스트까지 손쉽게!",
    illustration: "/illustrations/couple-planning.svg",
    bgGradient: "from-rose-400 to-pink-500",
  },
  {
    id: 2,
    icon: <Wallet className="w-8 h-8" />,
    title: "스마트한 예산 관리",
    description: "카테고리별 예산을 설정하고\n지출을 실시간으로 추적해보세요.",
    illustration: "/illustrations/budget-tracking.svg",
    bgGradient: "from-amber-400 to-orange-500",
  },
  {
    id: 3,
    icon: <Calendar className="w-8 h-8" />,
    title: "놓치지 않는 일정 관리",
    description: "D-day까지 중요한 일정을 관리하고\n알림을 받아보세요.",
    illustration: "/illustrations/calendar-schedule.svg",
    bgGradient: "from-blue-400 to-indigo-500",
  },
  {
    id: 4,
    icon: <CheckSquare className="w-8 h-8" />,
    title: "체계적인 체크리스트",
    description: "결혼 준비에 필요한 모든 할 일을\n시기별로 정리해드려요.",
    illustration: "/illustrations/checklist-done.svg",
    bgGradient: "from-emerald-400 to-teal-500",
  },
];

export const WelcomeOnboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
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
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
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
              w-64 h-64 rounded-full mb-8
              bg-gradient-to-br ${step.bgGradient}
              flex items-center justify-center
              shadow-2xl shadow-rose-500/20
            `}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white"
              >
                {/* 실제로는 일러스트 이미지 사용 */}
                <div className="w-32 h-32 flex items-center justify-center">
                  {step.icon}
                  <Sparkles className="w-6 h-6 absolute -top-2 -right-2 text-yellow-300" />
                </div>
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
```

### 개선안 B: 초기 설정 위저드

```tsx
// components/onboarding/SetupWizard.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Wallet, Camera, Check, ChevronRight } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const SetupWizard: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    groomName: '',
    brideName: '',
    weddingDate: '',
    totalBudget: '',
    couplePhoto: null,
  });

  const steps: SetupStep[] = [
    {
      id: 'couple',
      title: '커플 정보',
      description: '두 분의 이름을 알려주세요',
      icon: <User className="w-6 h-6" />,
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              신랑 이름
            </label>
            <input
              type="text"
              value={formData.groomName}
              onChange={(e) => setFormData(prev => ({ ...prev, groomName: e.target.value }))}
              placeholder="홍길동"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              신부 이름
            </label>
            <input
              type="text"
              value={formData.brideName}
              onChange={(e) => setFormData(prev => ({ ...prev, brideName: e.target.value }))}
              placeholder="김영희"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'date',
      title: '결혼 예정일',
      description: '특별한 날을 선택해주세요',
      icon: <Calendar className="w-6 h-6" />,
      component: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">💒</div>
            <p className="text-stone-500">D-day를 설정하면 남은 일수를 알려드려요</p>
          </div>
          <input
            type="date"
            value={formData.weddingDate}
            onChange={(e) => setFormData(prev => ({ ...prev, weddingDate: e.target.value }))}
            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent text-center text-lg"
          />
        </div>
      ),
    },
    {
      id: 'budget',
      title: '예산 설정',
      description: '대략적인 총 예산을 입력해주세요',
      icon: <Wallet className="w-6 h-6" />,
      component: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">💰</div>
            <p className="text-stone-500">나중에 언제든 수정할 수 있어요</p>
          </div>
          
          {/* 빠른 선택 버튼 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['3000만원', '5000만원', '7000만원', '1억원'].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  const value = amount.replace(/[^0-9]/g, '') + '0000';
                  setFormData(prev => ({ ...prev, totalBudget: value }));
                }}
                className={`
                  py-3 rounded-xl border-2 font-medium transition-all
                  ${formData.totalBudget === amount.replace(/[^0-9]/g, '') + '0000'
                    ? 'border-rose-500 bg-rose-50 text-rose-600'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }
                `}
              >
                {amount}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">₩</span>
            <input
              type="number"
              value={formData.totalBudget}
              onChange={(e) => setFormData(prev => ({ ...prev, totalBudget: e.target.value }))}
              placeholder="직접 입력"
              className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'photo',
      title: '커플 사진',
      description: '프로필 사진을 등록해주세요 (선택)',
      icon: <Camera className="w-6 h-6" />,
      component: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="w-40 h-40 rounded-full border-4 border-dashed border-stone-200 flex flex-col items-center justify-center hover:border-rose-300 transition-colors">
                {formData.couplePhoto ? (
                  <img 
                    src={URL.createObjectURL(formData.couplePhoto)} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-stone-300 mb-2" />
                    <span className="text-sm text-stone-400">사진 추가</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFormData(prev => ({ ...prev, couplePhoto: file as any }));
                }}
              />
            </label>
          </div>
          <p className="text-center text-sm text-stone-400">
            나중에 설정에서 변경할 수 있어요
          </p>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete(formData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* 진행 바 */}
      <div className="h-1 bg-stone-100">
        <motion.div
          className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 헤더 */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          className={`p-2 rounded-full hover:bg-stone-100 ${currentStep === 0 ? 'invisible' : ''}`}
        >
          <ChevronRight className="w-6 h-6 text-stone-600 rotate-180" />
        </button>
        <span className="text-sm text-stone-500">
          {currentStep + 1} / {steps.length}
        </span>
        <button
          onClick={() => onComplete(formData)}
          className="text-sm text-stone-400 hover:text-stone-600"
        >
          건너뛰기
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="max-w-md mx-auto"
        >
          {/* 스텝 아이콘 */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500">
              {currentStepData.icon}
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-bold text-stone-800 text-center mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-stone-500 text-center mb-8">
            {currentStepData.description}
          </p>

          {/* 폼 컴포넌트 */}
          {currentStepData.component}
        </motion.div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-8">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-lg hover:shadow-rose-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isLastStep ? (
            <>완료 <Check className="w-5 h-5" /></>
          ) : (
            <>다음 <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};
```

### 개선안 C: 기능 힌트 툴팁

```tsx
// components/onboarding/FeatureHints.tsx

import React, { useState, useEffect } from 'react';
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
    targetSelector: '.fab-button',
    title: '빠른 추가',
    description: '이 버튼을 눌러 지출, 일정, 식장을 빠르게 추가하세요!',
    position: 'top',
  },
  {
    id: 'budget-card',
    targetSelector: '.budget-summary',
    title: '예산 현황',
    description: '탭하면 상세한 예산 관리 페이지로 이동해요',
    position: 'bottom',
  },
  {
    id: 'dday-counter',
    targetSelector: '.dday-counter',
    title: 'D-day 카운터',
    description: '결혼까지 남은 날을 확인하세요. 설정에서 날짜를 변경할 수 있어요!',
    position: 'bottom',
  },
];

export const FeatureHints: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentHint = FEATURE_HINTS[currentHintIndex];

  useEffect(() => {
    if (currentHint) {
      const target = document.querySelector(currentHint.targetSelector);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentHintIndex]);

  const handleNext = () => {
    if (currentHintIndex < FEATURE_HINTS.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!currentHint || !targetRect) return null;

  return (
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
          className="absolute bg-white rounded-2xl p-4 shadow-2xl max-w-xs"
          style={{
            left: targetRect.left,
            top: currentHint.position === 'bottom' 
              ? targetRect.bottom + 16 
              : targetRect.top - 120,
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
  );
};
```

---

## 2. 위젯 기능

### 2.1 홈 화면 위젯 (PWA)

```tsx
// components/widgets/HomeWidget.tsx

import React from 'react';
import { Heart, Calendar, Wallet, CheckSquare } from 'lucide-react';

interface WidgetData {
  dDay: number;
  budgetProgress: number;
  checklistProgress: number;
  upcomingEvent?: {
    title: string;
    date: string;
  };
}

// 작은 위젯 (2x1)
export const SmallWidget: React.FC<{ data: WidgetData }> = ({ data }) => (
  <div className="w-full h-full bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white flex items-center justify-between">
    <div>
      <p className="text-rose-100 text-xs mb-1">결혼까지</p>
      <p className="text-3xl font-bold">D-{data.dDay}</p>
    </div>
    <Heart className="w-10 h-10 text-rose-300" fill="currentColor" />
  </div>
);

// 중간 위젯 (2x2)
export const MediumWidget: React.FC<{ data: WidgetData }> = ({ data }) => (
  <div className="w-full h-full bg-white rounded-2xl p-4 shadow-lg flex flex-col">
    {/* 헤더 */}
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-medium text-stone-500">Wedding Planner</span>
      <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
    </div>

    {/* D-day */}
    <div className="text-center mb-4">
      <p className="text-4xl font-bold text-rose-500">D-{data.dDay}</p>
      <p className="text-xs text-stone-400 mt-1">결혼까지</p>
    </div>

    {/* 진행률 */}
    <div className="space-y-2 mt-auto">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-amber-500" />
        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500 rounded-full"
            style={{ width: `${data.budgetProgress}%` }}
          />
        </div>
        <span className="text-xs text-stone-500">{data.budgetProgress}%</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-emerald-500" />
        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${data.checklistProgress}%` }}
          />
        </div>
        <span className="text-xs text-stone-500">{data.checklistProgress}%</span>
      </div>
    </div>
  </div>
);

// 큰 위젯 (4x2)
export const LargeWidget: React.FC<{ data: WidgetData }> = ({ data }) => (
  <div className="w-full h-full bg-gradient-to-br from-rose-500 via-rose-500 to-pink-500 rounded-2xl p-5 text-white flex">
    {/* 왼쪽: D-day */}
    <div className="flex-1 flex flex-col justify-center">
      <p className="text-rose-100 text-sm mb-1">결혼까지</p>
      <p className="text-5xl font-bold mb-2">D-{data.dDay}</p>
      <div className="flex items-center gap-4 mt-4">
        <div>
          <p className="text-rose-200 text-xs">예산</p>
          <p className="font-bold">{data.budgetProgress}%</p>
        </div>
        <div>
          <p className="text-rose-200 text-xs">체크리스트</p>
          <p className="font-bold">{data.checklistProgress}%</p>
        </div>
      </div>
    </div>

    {/* 오른쪽: 다가오는 일정 */}
    <div className="w-40 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4" />
        <span className="text-xs font-medium">다가오는 일정</span>
      </div>
      {data.upcomingEvent ? (
        <div>
          <p className="font-bold text-sm">{data.upcomingEvent.title}</p>
          <p className="text-xs text-rose-100">{data.upcomingEvent.date}</p>
        </div>
      ) : (
        <p className="text-xs text-rose-200">예정된 일정이 없어요</p>
      )}
    </div>
  </div>
);
```

### 2.2 대시보드 내 커스텀 위젯

```tsx
// components/widgets/DashboardWidgets.tsx

import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, X, Plus, Settings } from 'lucide-react';

type WidgetType = 'dday' | 'budget' | 'checklist' | 'schedule' | 'expense' | 'venue';

interface Widget {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
}

const WIDGET_CONFIGS: Record<WidgetType, { title: string; icon: React.ReactNode }> = {
  dday: { title: 'D-day', icon: '💒' },
  budget: { title: '예산 현황', icon: '💰' },
  checklist: { title: '체크리스트', icon: '✅' },
  schedule: { title: '다가오는 일정', icon: '📅' },
  expense: { title: '최근 지출', icon: '💳' },
  venue: { title: '관심 식장', icon: '🏛️' },
};

export const CustomizableDashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', type: 'dday', size: 'medium' },
    { id: '2', type: 'budget', size: 'large' },
    { id: '3', type: 'checklist', size: 'medium' },
    { id: '4', type: 'schedule', size: 'medium' },
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const handleAddWidget = (type: WidgetType) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      size: 'medium',
    };
    setWidgets(prev => [...prev, newWidget]);
    setShowAddWidget(false);
  };

  return (
    <div className="space-y-4">
      {/* 편집 모드 토글 */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${isEditMode 
              ? 'bg-rose-500 text-white' 
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }
          `}
        >
          <Settings className="w-4 h-4 inline-block mr-1" />
          {isEditMode ? '완료' : '편집'}
        </button>
      </div>

      {/* 위젯 그리드 */}
      <Reorder.Group
        axis="y"
        values={widgets}
        onReorder={setWidgets}
        className="space-y-4"
      >
        {widgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            className={`
              bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden
              ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}
            `}
          >
            <div className="relative">
              {/* 편집 모드 오버레이 */}
              {isEditMode && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-stone-400" />
                    <span className="font-medium text-stone-700">
                      {WIDGET_CONFIGS[widget.type].icon} {WIDGET_CONFIGS[widget.type].title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="p-2 rounded-full hover:bg-red-100 text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* 위젯 콘텐츠 */}
              <div className="p-4">
                <WidgetContent type={widget.type} />
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* 위젯 추가 버튼 */}
      {isEditMode && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowAddWidget(true)}
          className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          위젯 추가
        </motion.button>
      )}

      {/* 위젯 추가 모달 */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6"
          >
            <h3 className="text-lg font-bold text-stone-800 mb-4">위젯 추가</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(WIDGET_CONFIGS).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => handleAddWidget(type as WidgetType)}
                  className="p-4 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
                >
                  <span className="text-2xl mb-2 block">{config.icon}</span>
                  <span className="font-medium text-stone-700">{config.title}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddWidget(false)}
              className="w-full mt-4 py-3 text-stone-500 font-medium"
            >
              취소
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// 각 위젯 타입별 콘텐츠 렌더링
const WidgetContent: React.FC<{ type: WidgetType }> = ({ type }) => {
  // 실제 데이터는 훅으로 가져옴
  switch (type) {
    case 'dday':
      return <DDayWidget />;
    case 'budget':
      return <BudgetWidget />;
    case 'checklist':
      return <ChecklistWidget />;
    case 'schedule':
      return <ScheduleWidget />;
    case 'expense':
      return <ExpenseWidget />;
    case 'venue':
      return <VenueWidget />;
    default:
      return null;
  }
};

// 개별 위젯 컴포넌트들 (간략화)
const DDayWidget = () => (
  <div className="text-center py-4">
    <p className="text-sm text-stone-500 mb-1">결혼까지</p>
    <p className="text-4xl font-bold text-rose-500">D-281</p>
  </div>
);

const BudgetWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3">예산 현황</h4>
    <div className="space-y-2">
      {/* 간략한 예산 바 */}
    </div>
  </div>
);

const ChecklistWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3">체크리스트</h4>
    {/* 최근 체크리스트 아이템 */}
  </div>
);

const ScheduleWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3">다가오는 일정</h4>
    {/* 일정 리스트 */}
  </div>
);

const ExpenseWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3">최근 지출</h4>
    {/* 지출 리스트 */}
  </div>
);

const VenueWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3">관심 식장</h4>
    {/* 식장 카드 */}
  </div>
);
```

---

## 3. 로딩 애니메이션

### 3.1 앱 시작 스플래시 스크린

```tsx
// components/loading/SplashScreen.tsx

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
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
          {/* 배경 장식 */}
          <div className="absolute inset-0 overflow-hidden">
            {/* 떠다니는 하트들 */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: window.innerHeight + 50,
                  opacity: 0.3,
                  scale: 0.5 + Math.random() * 0.5,
                }}
                animate={{ 
                  y: -100,
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
              className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full"
            />
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
```

### 3.2 페이지 전환 로딩

```tsx
// components/loading/PageTransition.tsx

import React from 'react';
import { motion } from 'framer-motion';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// App.tsx에서 사용
// <AnimatePresence mode="wait">
//   <Routes location={location} key={location.pathname}>
//     <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
//     ...
//   </Routes>
// </AnimatePresence>
```

### 3.3 컴포넌트 로딩 스켈레톤 개선

```tsx
// components/loading/EnhancedSkeleton.tsx

import React from 'react';
import { motion } from 'framer-motion';

// 시머 애니메이션이 있는 스켈레톤
export const ShimmerSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative overflow-hidden bg-stone-200 rounded-xl ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

// 펄스 애니메이션 스켈레톤
export const PulseSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={`bg-stone-200 rounded-xl ${className}`}
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  />
);

// 대시보드 스켈레톤 개선
export const EnhancedDashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    {/* 커플 헤더 스켈레톤 */}
    <div className="bg-white rounded-2xl p-6 border border-stone-100">
      <div className="flex items-center gap-4">
        <div className="flex -space-x-3">
          <ShimmerSkeleton className="w-16 h-16 rounded-full" />
          <ShimmerSkeleton className="w-16 h-16 rounded-full" />
        </div>
        <div className="flex-1 space-y-2">
          <ShimmerSkeleton className="h-6 w-32" />
          <ShimmerSkeleton className="h-4 w-24" />
        </div>
        <ShimmerSkeleton className="h-12 w-24 rounded-xl" />
      </div>
    </div>

    {/* 요약 카드 스켈레톤 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white rounded-2xl p-4 border border-stone-100"
        >
          <ShimmerSkeleton className="h-4 w-16 mb-2" />
          <ShimmerSkeleton className="h-8 w-24 mb-1" />
          <ShimmerSkeleton className="h-3 w-20" />
        </motion.div>
      ))}
    </div>

    {/* 차트 스켈레톤 */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-100">
        <ShimmerSkeleton className="h-5 w-40 mb-4" />
        <div className="flex items-end gap-2 h-[200px]">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${30 + Math.random() * 60}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="flex-1 bg-stone-100 rounded-t-lg"
            />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-stone-100">
        <ShimmerSkeleton className="h-5 w-32 mb-4" />
        <div className="flex items-center justify-center h-[200px]">
          <ShimmerSkeleton className="w-32 h-32 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);
```

### 3.4 데이터 로딩 인디케이터

```tsx
// components/loading/LoadingIndicators.tsx

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
```

### 3.5 App.tsx 통합

```tsx
// App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SplashScreen } from './components/loading/SplashScreen';
import { WelcomeOnboarding } from './components/onboarding/WelcomeOnboarding';
import { SetupWizard } from './components/onboarding/SetupWizard';
import { Layout } from './components/Layout';
import { AppRoutes } from './routes';

type AppState = 'splash' | 'onboarding' | 'setup' | 'ready';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // 첫 방문 여부 확인
    const hasVisited = localStorage.getItem('hasVisited');
    const hasCompletedSetup = localStorage.getItem('hasCompletedSetup');
    
    if (!hasVisited) {
      setIsFirstVisit(true);
    } else if (!hasCompletedSetup) {
      // 온보딩은 했지만 설정은 안 한 경우
      setAppState('setup');
    }
  }, []);

  const handleSplashComplete = () => {
    if (isFirstVisit) {
      setAppState('onboarding');
    } else {
      setAppState('ready');
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasVisited', 'true');
    setAppState('setup');
  };

  const handleSetupComplete = (data: any) => {
    localStorage.setItem('hasCompletedSetup', 'true');
    // 초기 데이터 저장 로직
    console.log('Setup data:', data);
    setAppState('ready');
  };

  const handleSkipSetup = () => {
    localStorage.setItem('hasCompletedSetup', 'true');
    setAppState('ready');
  };

  return (
    <BrowserRouter>
      {/* 스플래시 스크린 */}
      {appState === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* 온보딩 (첫 방문 시) */}
      {appState === 'onboarding' && (
        <WelcomeOnboarding onComplete={handleOnboardingComplete} />
      )}

      {/* 초기 설정 위저드 */}
      {appState === 'setup' && (
        <SetupWizard 
          onComplete={handleSetupComplete}
        />
      )}

      {/* 메인 앱 */}
      {appState === 'ready' && (
        <Layout>
          <AppRoutes />
        </Layout>
      )}
    </BrowserRouter>
  );
};

export default App;
```

---

## 4. 추가 디자인 개선

### 4.1 마일스톤 축하 모달

```tsx
// components/celebration/MilestoneCelebration.tsx

import React from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Heart, Star, Trophy, PartyPopper } from 'lucide-react';

interface MilestoneProps {
  type: 'd100' | 'd30' | 'd7' | 'checklist50' | 'checklist100';
  onClose: () => void;
}

const MILESTONE_CONFIGS = {
  d100: {
    title: 'D-100 달성! 🎉',
    subtitle: '결혼까지 100일 남았어요',
    icon: <Heart className="w-16 h-16 text-rose-500" fill="currentColor" />,
    message: '벌써 100일이에요! 남은 시간 동안 행복하게 준비해요 💕',
    color: 'from-rose-500 to-pink-500',
  },
  d30: {
    title: 'D-30! 한 달 남았어요',
    subtitle: '곧 특별한 날이 다가와요',
    icon: <Star className="w-16 h-16 text-amber-400" fill="currentColor" />,
    message: '이제 정말 얼마 안 남았네요! 마지막 점검을 해볼까요?',
    color: 'from-amber-400 to-orange-500',
  },
  d7: {
    title: 'D-7! 일주일 남았어요',
    subtitle: '설렘이 가득한 시간',
    icon: <PartyPopper className="w-16 h-16 text-purple-500" />,
    message: '드디어 일주일! 긴장되지만 행복한 순간이 다가오고 있어요',
    color: 'from-purple-500 to-indigo-500',
  },
  checklist50: {
    title: '체크리스트 50% 완료!',
    subtitle: '절반이나 해냈어요',
    icon: <Trophy className="w-16 h-16 text-emerald-500" />,
    message: '대단해요! 이 속도라면 완벽한 결혼식이 될 거예요 ✨',
    color: 'from-emerald-500 to-teal-500',
  },
  checklist100: {
    title: '체크리스트 완료! 🏆',
    subtitle: '모든 준비가 끝났어요',
    icon: <Trophy className="w-16 h-16 text-yellow-500" fill="currentColor" />,
    message: '축하해요! 이제 남은 건 행복한 결혼식뿐이에요 🎊',
    color: 'from-yellow-400 to-amber-500',
  },
};

export const MilestoneCelebration: React.FC<MilestoneProps> = ({ type, onClose }) => {
  const config = MILESTONE_CONFIGS[type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* 컨페티 */}
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={200}
        colors={['#f43f5e', '#ec4899', '#fbbf24', '#a855f7', '#3b82f6']}
      />

      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
      >
        {/* 아이콘 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`
            w-28 h-28 mx-auto mb-6 rounded-full
            bg-gradient-to-br ${config.color}
            flex items-center justify-center
            shadow-lg
          `}
        >
          <div className="text-white">
            {config.icon}
          </div>
        </motion.div>

        {/* 텍스트 */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-stone-800 mb-2"
        >
          {config.title}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-stone-500 mb-4"
        >
          {config.subtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-stone-600 leading-relaxed mb-6"
        >
          {config.message}
        </motion.p>

        {/* 버튼 */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onClose}
          className={`
            w-full py-3 rounded-xl font-bold text-white
            bg-gradient-to-r ${config.color}
            hover:shadow-lg active:scale-[0.98] transition-all
          `}
        >
          좋아요! 💪
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
```

---

## 📊 구현 우선순위

| 순위 | 기능 | 난이도 | 사용자 임팩트 |
|------|------|--------|---------------|
| 1 | 스플래시 스크린 | 🟢 쉬움 | ⭐⭐⭐⭐⭐ |
| 2 | 스켈레톤 로딩 개선 | 🟢 쉬움 | ⭐⭐⭐⭐ |
| 3 | 초기 설정 위저드 | 🟡 보통 | ⭐⭐⭐⭐⭐ |
| 4 | 웰컴 온보딩 | 🟡 보통 | ⭐⭐⭐⭐ |
| 5 | 마일스톤 축하 | 🟡 보통 | ⭐⭐⭐⭐ |
| 6 | 커스텀 위젯 | 🔴 어려움 | ⭐⭐⭐ |
| 7 | 기능 힌트 툴팁 | 🔴 어려움 | ⭐⭐⭐ |

---

## 📝 필요한 추가 패키지

```bash
npm install react-confetti  # 축하 효과
npm install framer-motion   # 이미 있다면 패스
```

---

*작성일: 2025-12-28*
*버전: 1.0*
