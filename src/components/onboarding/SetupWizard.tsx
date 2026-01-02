import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Wallet, Camera, Check, ChevronRight, ChevronLeft } from 'lucide-react';

interface SetupData {
  groomName: string;
  brideName: string;
  weddingDate: string;
  totalBudget: string;
  couplePhoto: File | null;
}

interface SetupWizardProps {
  onComplete: (data: SetupData) => void;
  onSkip?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SetupData>({
    groomName: '',
    brideName: '',
    weddingDate: '',
    totalBudget: '',
    couplePhoto: null,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const steps = [
    {
      id: 'couple',
      title: '커플 정보',
      description: '두 분의 이름을 알려주세요',
      icon: <User className="w-6 h-6" />,
    },
    {
      id: 'date',
      title: '결혼 예정일',
      description: '특별한 날을 선택해주세요',
      icon: <Calendar className="w-6 h-6" />,
    },
    {
      id: 'budget',
      title: '예산 설정',
      description: '대략적인 총 예산을 입력해주세요',
      icon: <Wallet className="w-6 h-6" />,
    },
    {
      id: 'photo',
      title: '커플 사진',
      description: '프로필 사진을 등록해주세요 (선택)',
      icon: <Camera className="w-6 h-6" />,
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, couplePhoto: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleBudgetQuickSelect = (amount: string) => {
    const value = amount.replace(/[^0-9]/g, '') + '0000';
    setFormData(prev => ({ ...prev, totalBudget: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
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
        );
      case 1:
        return (
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
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">💰</div>
              <p className="text-stone-500">나중에 언제든 수정할 수 있어요</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['3000만원', '5000만원', '7000만원', '1억원'].map((amount) => {
                const value = amount.replace(/[^0-9]/g, '') + '0000';
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleBudgetQuickSelect(amount)}
                    className={`
                      py-3 rounded-xl border-2 font-medium transition-all
                      ${formData.totalBudget === value
                        ? 'border-rose-500 bg-rose-50 text-rose-600'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }
                    `}
                  >
                    {amount}
                  </button>
                );
              })}
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
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <div className="w-40 h-40 rounded-full border-4 border-dashed border-stone-200 flex flex-col items-center justify-center hover:border-rose-300 transition-colors overflow-hidden">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="커플 사진 미리보기"
                      className="w-full h-full object-cover"
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
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <p className="text-center text-sm text-stone-400">
              나중에 설정에서 변경할 수 있어요
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col safe-area-inset">
      {/* 진행 바 */}
      <div className="h-1 bg-stone-100 safe-area-pt">
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
          <ChevronLeft className="w-6 h-6 text-stone-600" />
        </button>
        <span className="text-sm text-stone-500">
          {currentStep + 1} / {steps.length}
        </span>
        <button
          onClick={onSkip || (() => onComplete(formData))}
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
          {renderStepContent()}
        </motion.div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-8 safe-area-pb">
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

export default SetupWizard;
