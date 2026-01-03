import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Venue } from '@/types/types';
import { 
  Check, ChevronRight, MapPin, Calendar, Star, 
  Wallet, Users, Car, Sparkles, FileText, Camera,
  Edit2, X
} from 'lucide-react';
import { Button } from '../ui/Button';

interface SelectedVenueDetailProps {
  venue: Venue;
  onEdit: (venue: Venue) => void;
  onDeselect: () => void;
}

type Step = 'basic' | 'cost' | 'options' | 'memo';

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'basic', label: '기본 정보', icon: <MapPin size={16} /> },
  { id: 'cost', label: '비용', icon: <Wallet size={16} /> },
  { id: 'options', label: '옵션', icon: <Sparkles size={16} /> },
  { id: 'memo', label: '메모', icon: <FileText size={16} /> },
];

export const SelectedVenueDetail: React.FC<SelectedVenueDetailProps> = ({
  venue,
  onEdit,
  onDeselect,
}) => {
  const [activeStep, setActiveStep] = useState<Step>('basic');

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const calculateTotal = () => {
    let total = venue.rentalFee + (venue.mealCostPerPerson * venue.minimumGuests);
    if (!venue.sdmIncluded) total += (venue.studioFee + venue.dressFee + venue.makeupFee);
    if (!venue.bouquetIncluded) total += venue.bouquetFee;
    if (!venue.rehearsalMakeupIncluded) total += venue.rehearsalMakeupFee;
    total += (venue.extraFittingFee || 0);
    total += (venue.weddingRobeFee || 0);
    total += (venue.outdoorVenueFee || 0);
    total += (venue.freshFlowerFee || 0);
    return total;
  };

  const getThumbnailUrl = () => {
    if (!venue.images || venue.images.length === 0) return null;
    const thumbnail = venue.images.find(img => img.id === venue.thumbnailImage) || venue.images[0];
    return thumbnail.url;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 'basic':
        return (
          <motion.div
            key="basic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs text-stone-500 mb-1">위치</p>
                <p className="font-medium text-stone-800 flex items-center gap-1">
                  <MapPin size={14} className="text-rose-500" />
                  {venue.location || '미입력'}
                </p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs text-stone-500 mb-1">방문일</p>
                <p className="font-medium text-stone-800 flex items-center gap-1">
                  <Calendar size={14} className="text-rose-500" />
                  {venue.visitDate || '미정'}
                </p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs text-stone-500 mb-1">보증 인원</p>
                <p className="font-medium text-stone-800 flex items-center gap-1">
                  <Users size={14} className="text-rose-500" />
                  {venue.minimumGuests}명
                </p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs text-stone-500 mb-1">주차</p>
                <p className="font-medium text-stone-800 flex items-center gap-1">
                  <Car size={14} className="text-rose-500" />
                  {venue.parkingSpaces}대
                </p>
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-500 mb-1">평점</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={star <= venue.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'}
                  />
                ))}
                <span className="ml-2 font-bold text-stone-800">{venue.rating}/5</span>
              </div>
            </div>
          </motion.div>
        );

      case 'cost':
        return (
          <motion.div
            key="cost"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <p className="text-xs text-rose-600 mb-1">총 예상 견적</p>
              <p className="text-2xl font-bold text-rose-600">{formatMoney(calculateTotal())}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-stone-100">
                <span className="text-stone-600">대관료</span>
                <span className="font-medium text-stone-800">{formatMoney(venue.rentalFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-100">
                <span className="text-stone-600">식대 ({venue.minimumGuests}명 × {formatMoney(venue.mealCostPerPerson)})</span>
                <span className="font-medium text-stone-800">{formatMoney(venue.mealCostPerPerson * venue.minimumGuests)}</span>
              </div>
              {!venue.sdmIncluded && (
                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">스드메</span>
                  <span className="font-medium text-stone-800">{formatMoney(venue.studioFee + venue.dressFee + venue.makeupFee)}</span>
                </div>
              )}
              {!venue.bouquetIncluded && venue.bouquetFee > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">부케</span>
                  <span className="font-medium text-stone-800">{formatMoney(venue.bouquetFee)}</span>
                </div>
              )}
              {!venue.rehearsalMakeupIncluded && venue.rehearsalMakeupFee > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">리허설 메이크업</span>
                  <span className="font-medium text-stone-800">{formatMoney(venue.rehearsalMakeupFee)}</span>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'options':
        return (
          <motion.div
            key="options"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className={`flex items-center justify-between p-3 rounded-xl ${venue.sdmIncluded ? 'bg-green-50 border border-green-100' : 'bg-stone-50'}`}>
              <span className="text-stone-700">스드메 포함</span>
              {venue.sdmIncluded ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <Check size={16} /> 포함
                </span>
              ) : (
                <span className="text-stone-500">별도</span>
              )}
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${venue.bouquetIncluded ? 'bg-green-50 border border-green-100' : 'bg-stone-50'}`}>
              <span className="text-stone-700">부케 포함</span>
              {venue.bouquetIncluded ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <Check size={16} /> 포함
                </span>
              ) : (
                <span className="text-stone-500">별도 ({formatMoney(venue.bouquetFee)})</span>
              )}
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${venue.rehearsalMakeupIncluded ? 'bg-green-50 border border-green-100' : 'bg-stone-50'}`}>
              <span className="text-stone-700">리허설 메이크업</span>
              {venue.rehearsalMakeupIncluded ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <Check size={16} /> 포함
                </span>
              ) : (
                <span className="text-stone-500">별도 ({formatMoney(venue.rehearsalMakeupFee)})</span>
              )}
            </div>
            
            {/* 추가 옵션 */}
            {(venue.extraFittingFee || venue.weddingRobeFee || venue.outdoorVenueFee || venue.freshFlowerFee) ? (
              <div className="mt-4 pt-4 border-t border-stone-200">
                <p className="text-xs text-stone-500 mb-2">추가 비용</p>
                <div className="grid grid-cols-2 gap-2">
                  {venue.extraFittingFee > 0 && (
                    <div className="bg-stone-50 p-2 rounded-lg text-sm">
                      <span className="text-stone-500">추가피팅</span>
                      <span className="block font-medium">{formatMoney(venue.extraFittingFee)}</span>
                    </div>
                  )}
                  {venue.weddingRobeFee > 0 && (
                    <div className="bg-stone-50 p-2 rounded-lg text-sm">
                      <span className="text-stone-500">예도</span>
                      <span className="block font-medium">{formatMoney(venue.weddingRobeFee)}</span>
                    </div>
                  )}
                  {venue.outdoorVenueFee > 0 && (
                    <div className="bg-stone-50 p-2 rounded-lg text-sm">
                      <span className="text-stone-500">야외식장</span>
                      <span className="block font-medium">{formatMoney(venue.outdoorVenueFee)}</span>
                    </div>
                  )}
                  {venue.freshFlowerFee > 0 && (
                    <div className="bg-stone-50 p-2 rounded-lg text-sm">
                      <span className="text-stone-500">생화</span>
                      <span className="block font-medium">{formatMoney(venue.freshFlowerFee)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        );

      case 'memo':
        return (
          <motion.div
            key="memo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {venue.additionalBenefits && (
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs text-stone-500 mb-2">부가 혜택</p>
                <p className="text-stone-700 whitespace-pre-wrap">{venue.additionalBenefits}</p>
              </div>
            )}
            {venue.memo && (
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs text-stone-500 mb-2">메모</p>
                <p className="text-stone-700 whitespace-pre-wrap">{venue.memo}</p>
              </div>
            )}
            {!venue.additionalBenefits && !venue.memo && (
              <div className="text-center py-8 text-stone-400">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>등록된 메모가 없습니다</p>
              </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-200 shadow-lg overflow-hidden">
      {/* 헤더 - 선택된 예식장 */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Check size={18} />
            </div>
            <span className="text-sm font-medium text-white/90">선택된 예식장</span>
          </div>
          <button
            onClick={onDeselect}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="선택 해제"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {getThumbnailUrl() ? (
            <img
              src={getThumbnailUrl()!}
              alt={venue.name}
              className="w-16 h-16 rounded-xl object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera size={24} className="text-white/60" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold truncate">{venue.name}</h3>
            <p className="text-white/80 text-sm flex items-center gap-1">
              <MapPin size={12} />
              {venue.location}
            </p>
          </div>
        </div>
      </div>

      {/* 단계별 탭 */}
      <div className="flex border-b border-stone-200">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
              activeStep === step.id
                ? 'text-rose-600 bg-rose-50'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            {step.icon}
            <span className="hidden sm:inline">{step.label}</span>
            {activeStep === step.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="p-4 min-h-[200px]">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* 수정 버튼 */}
      <div className="p-4 border-t border-stone-100">
        <Button
          onClick={() => onEdit(venue)}
          variant="outline"
          className="w-full"
          icon={<Edit2 size={16} />}
        >
          정보 수정하기
        </Button>
      </div>
    </div>
  );
};

export default SelectedVenueDetail;
