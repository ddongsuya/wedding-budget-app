import React, { useState } from 'react';
import { Venue } from '../../types';
import { X, Calculator, Star, Check, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface VenueCompareProps {
  venues: Venue[];
  onClose: () => void;
}

// 모바일 탭 카테고리 정의
type MobileTab = 'estimate' | 'location' | 'cost' | 'options' | 'memo';

const MOBILE_TABS: { key: MobileTab; label: string; icon: string }[] = [
  { key: 'estimate', label: '총 견적', icon: '💰' },
  { key: 'location', label: '상태/위치', icon: '📍' },
  { key: 'cost', label: '대관료/식대', icon: '🍽️' },
  { key: 'options', label: '스드메/옵션', icon: '💄' },
  { key: 'memo', label: '혜택/메모', icon: '📝' },
];

export const VenueCompare: React.FC<VenueCompareProps> = ({ venues, onClose }) => {
  const [guestCount, setGuestCount] = useState<number>(250);
  const [activeTab, setActiveTab] = useState<MobileTab>('estimate');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 화면 크기 감지
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const calculateTotal = (venue: Venue) => {
    let total = venue.rentalFee + (venue.mealCostPerPerson * Math.max(guestCount, venue.minimumGuests));
    if (!venue.sdmIncluded) {
      total += (venue.studioFee + venue.dressFee + venue.makeupFee);
    }
    if (!venue.bouquetIncluded) total += venue.bouquetFee;
    if (!venue.rehearsalMakeupIncluded) total += venue.rehearsalMakeupFee;
    return total;
  };

  const totals = venues.map(v => calculateTotal(v));
  const minTotal = Math.min(...totals);

  // 탭 네비게이션
  const currentTabIndex = MOBILE_TABS.findIndex(t => t.key === activeTab);
  const goToNextTab = () => {
    if (currentTabIndex < MOBILE_TABS.length - 1) {
      setActiveTab(MOBILE_TABS[currentTabIndex + 1].key);
    }
  };
  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(MOBILE_TABS[currentTabIndex - 1].key);
    }
  };

  // 모바일 탭 컨텐츠 렌더링
  const renderMobileTabContent = () => {
    switch (activeTab) {
      case 'estimate':
        return (
          <div className="space-y-3">
            {venues.map(venue => {
              const total = calculateTotal(venue);
              const isCheapest = total === minTotal;
              return (
                <div key={venue.id} className={`p-4 rounded-2xl border ${isCheapest ? 'bg-rose-50 border-rose-200' : 'bg-white border-stone-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-stone-800">{venue.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                        <Star size={10} className="fill-yellow-400 text-yellow-400"/>
                        {venue.rating}
                      </div>
                    </div>
                    {isCheapest && (
                      <span className="text-[10px] bg-rose-500 text-white px-2 py-1 rounded-full font-bold">최저가</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-rose-600">{formatMoney(total)}</p>
                  <p className="text-xs text-stone-500 mt-1">인당 {formatMoney(Math.round(total / guestCount))} 꼴</p>
                </div>
              );
            })}
          </div>
        );

      case 'location':
        return (
          <div className="space-y-3">
            {venues.map(venue => (
              <div key={venue.id} className="p-4 rounded-2xl bg-white border border-stone-200">
                <h3 className="font-bold text-stone-800 mb-2">{venue.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-500">상태</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      venue.status === 'contracted' ? 'bg-rose-100 text-rose-700' : 
                      venue.status === 'visited' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {venue.status === 'contracted' ? '계약완료' : venue.status === 'visited' ? '방문완료' : '방문예정'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-500">위치</span>
                    <span className="text-sm font-medium text-stone-700">{venue.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-500">주차</span>
                    <span className="text-sm font-medium text-stone-700">{venue.parkingSpaces}대</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'cost':
        return (
          <div className="space-y-3">
            {venues.map(venue => (
              <div key={venue.id} className="p-4 rounded-2xl bg-white border border-stone-200">
                <h3 className="font-bold text-stone-800 mb-3">{venue.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="text-sm text-stone-500">대관료</span>
                    <span className="text-sm font-bold text-stone-800">{formatMoney(venue.rentalFee)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="text-sm text-stone-500">1인 식대</span>
                    <span className="text-sm font-bold text-stone-800">{formatMoney(venue.mealCostPerPerson)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="text-sm text-stone-500">보증 인원</span>
                    <span className="text-sm font-bold text-stone-800">{venue.minimumGuests}명</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-stone-500">식대 소계</span>
                    <span className="text-sm font-bold text-rose-600">
                      {formatMoney(venue.mealCostPerPerson * Math.max(guestCount, venue.minimumGuests))}
                    </span>
                  </div>
                  {guestCount < venue.minimumGuests && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg mt-2">
                      ⚠ 보증인원({venue.minimumGuests}명) 미달로 최소 식대가 적용됩니다.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'options':
        return (
          <div className="space-y-3">
            {venues.map(venue => (
              <div key={venue.id} className="p-4 rounded-2xl bg-white border border-stone-200">
                <h3 className="font-bold text-stone-800 mb-3">{venue.name}</h3>
                <div className="space-y-3">
                  {/* 스드메 */}
                  <div className="p-3 rounded-xl bg-stone-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-stone-700">스드메</span>
                      {venue.sdmIncluded ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">
                          <Check size={12}/> 포함
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-stone-500 text-xs">
                          <Minus size={12}/> 별도
                        </span>
                      )}
                    </div>
                    {!venue.sdmIncluded && (
                      <div className="text-xs text-stone-500 space-y-1 pl-2 border-l-2 border-stone-200">
                        {venue.studioFee > 0 && <p>스튜디오: {formatMoney(venue.studioFee)}</p>}
                        {venue.dressFee > 0 && <p>드레스: {formatMoney(venue.dressFee)}</p>}
                        {venue.makeupFee > 0 && <p>메이크업: {formatMoney(venue.makeupFee)}</p>}
                        <p className="font-medium text-stone-700 pt-1">
                          합계: {formatMoney(venue.studioFee + venue.dressFee + venue.makeupFee)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 기타 옵션 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-stone-50 text-center">
                      <span className="text-[10px] text-stone-400 block">부케</span>
                      <span className={`text-xs font-medium ${venue.bouquetIncluded ? 'text-green-600' : 'text-stone-600'}`}>
                        {venue.bouquetIncluded ? '포함' : venue.bouquetFee > 0 ? formatMoney(venue.bouquetFee) : '-'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50 text-center">
                      <span className="text-[10px] text-stone-400 block">리허설 메이크업</span>
                      <span className={`text-xs font-medium ${venue.rehearsalMakeupIncluded ? 'text-green-600' : 'text-stone-600'}`}>
                        {venue.rehearsalMakeupIncluded ? '포함' : venue.rehearsalMakeupFee > 0 ? formatMoney(venue.rehearsalMakeupFee) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'memo':
        return (
          <div className="space-y-3">
            {venues.map(venue => (
              <div key={venue.id} className="p-4 rounded-2xl bg-white border border-stone-200">
                <h3 className="font-bold text-stone-800 mb-3">{venue.name}</h3>
                <div className="space-y-3">
                  {venue.additionalBenefits ? (
                    <div className="bg-rose-50 p-3 rounded-xl">
                      <span className="text-xs font-bold text-rose-600 block mb-1">🎁 혜택</span>
                      <p className="text-sm text-rose-700">{venue.additionalBenefits}</p>
                    </div>
                  ) : (
                    <div className="bg-stone-50 p-3 rounded-xl text-center">
                      <span className="text-xs text-stone-400">등록된 혜택 없음</span>
                    </div>
                  )}
                  {venue.memo ? (
                    <div className="bg-stone-50 p-3 rounded-xl">
                      <span className="text-xs font-bold text-stone-500 block mb-1">📝 메모</span>
                      <p className="text-sm text-stone-600 italic">"{venue.memo}"</p>
                    </div>
                  ) : (
                    <div className="bg-stone-50 p-3 rounded-xl text-center">
                      <span className="text-xs text-stone-400">등록된 메모 없음</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // 데스크톱 테이블 렌더링
  const renderDesktopTable = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden min-w-fit mx-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-100">
            <th className="p-4 w-32 md:w-48 sticky left-0 bg-stone-100 border-r border-stone-200 text-left font-bold text-stone-600 z-10">
              구분
            </th>
            {venues.map(venue => (
              <th key={venue.id} className="p-4 min-w-[180px] lg:min-w-[220px] text-left border-r border-stone-100 last:border-0 bg-stone-50">
                <div className="space-y-1">
                  <h3 className="text-base lg:text-lg font-bold text-stone-800 line-clamp-1">{venue.name}</h3>
                  <p className="text-stone-500 font-normal flex items-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400"/>
                    {venue.rating} / 5.0
                  </p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {/* Total Estimate Row */}
          <tr className="bg-rose-50/30">
            <td className="p-4 sticky left-0 bg-rose-50 border-r border-rose-100 font-bold text-rose-600 z-10">
              총 예상 견적
              <span className="block text-[10px] font-normal text-rose-400 mt-1">({guestCount}명 기준)</span>
            </td>
            {venues.map(venue => {
              const total = calculateTotal(venue);
              const isCheapest = total === minTotal;
              return (
                <td key={venue.id} className={`p-4 border-r border-rose-50 last:border-0 align-top ${isCheapest ? 'bg-rose-100/50' : ''}`}>
                  <p className="text-lg lg:text-xl font-bold text-rose-600">{formatMoney(total)}</p>
                  {isCheapest && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded ml-1">최저가</span>}
                  <p className="text-xs text-stone-500 mt-1">인당 {formatMoney(Math.round(total / guestCount))} 꼴</p>
                </td>
              );
            })}
          </tr>

          {/* Status & Location */}
          <tr>
            <td className="p-4 sticky left-0 bg-white border-r border-stone-200 font-medium text-stone-600 z-10">상태 / 위치</td>
            {venues.map(venue => (
              <td key={venue.id} className="p-4 border-r border-stone-100 last:border-0 align-top">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-1 ${
                   venue.status === 'contracted' ? 'bg-rose-100 text-rose-700' : 
                   venue.status === 'visited' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                }`}>
                  {venue.status === 'contracted' ? '계약완료' : venue.status === 'visited' ? '방문완료' : '방문예정'}
                </span>
                <p className="text-stone-700 text-sm">{venue.location}</p>
              </td>
            ))}
          </tr>

          {/* Rental & Meal */}
          <tr>
            <td className="p-4 sticky left-0 bg-white border-r border-stone-200 font-medium text-stone-600 z-10">대관료 / 식대</td>
            {venues.map(venue => (
              <td key={venue.id} className="p-4 border-r border-stone-100 last:border-0 align-top space-y-2">
                <div className="flex justify-between items-center text-xs">
                   <span className="text-stone-500">대관료</span>
                   <span className="font-bold text-stone-800">{formatMoney(venue.rentalFee)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-stone-500">1인 식대</span>
                   <span className="font-bold text-stone-800">{formatMoney(venue.mealCostPerPerson)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-stone-500">보증 인원</span>
                   <span className="font-bold text-stone-800">{venue.minimumGuests}명</span>
                </div>
                {guestCount < venue.minimumGuests && (
                   <p className="text-[10px] text-amber-500 bg-amber-50 p-1 rounded">
                     ⚠ 보증인원({venue.minimumGuests}명) 미달로 최소 식대가 적용됩니다.
                   </p>
                )}
              </td>
            ))}
          </tr>

          {/* SDM */}
          <tr>
            <td className="p-4 sticky left-0 bg-white border-r border-stone-200 font-medium text-stone-600 z-10">스드메</td>
            {venues.map(venue => (
              <td key={venue.id} className="p-4 border-r border-stone-100 last:border-0 align-top">
                {venue.sdmIncluded ? (
                  <div className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 w-fit px-2 py-1 rounded">
                    <Check size={14} /> 포함
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-stone-400 text-sm mb-1">
                       <Minus size={14} /> 별도 (총 {formatMoney(venue.studioFee + venue.dressFee + venue.makeupFee)})
                    </div>
                    {venue.studioFee > 0 && <p className="text-xs text-stone-500">스튜디오: {formatMoney(venue.studioFee)}</p>}
                    {venue.dressFee > 0 && <p className="text-xs text-stone-500">드레스: {formatMoney(venue.dressFee)}</p>}
                    {venue.makeupFee > 0 && <p className="text-xs text-stone-500">메이크업: {formatMoney(venue.makeupFee)}</p>}
                  </div>
                )}
              </td>
            ))}
          </tr>

          {/* Parking & Options */}
          <tr>
            <td className="p-4 sticky left-0 bg-white border-r border-stone-200 font-medium text-stone-600 z-10">주차 / 기타옵션</td>
            {venues.map(venue => (
              <td key={venue.id} className="p-4 border-r border-stone-100 last:border-0 align-top space-y-2">
                <p className="text-sm font-medium text-stone-800">주차 {venue.parkingSpaces}대</p>
                <div className="text-xs space-y-1 text-stone-600">
                  <p className="flex justify-between">
                     <span>부케</span>
                     <span className={venue.bouquetIncluded ? 'text-green-600 font-bold' : ''}>
                       {venue.bouquetIncluded ? '포함' : venue.bouquetFee > 0 ? formatMoney(venue.bouquetFee) : '-'}
                     </span>
                  </p>
                  <p className="flex justify-between">
                     <span>리허설 메이크업</span>
                     <span className={venue.rehearsalMakeupIncluded ? 'text-green-600 font-bold' : ''}>
                       {venue.rehearsalMakeupIncluded ? '포함' : venue.rehearsalMakeupFee > 0 ? formatMoney(venue.rehearsalMakeupFee) : '-'}
                     </span>
                  </p>
                </div>
              </td>
            ))}
          </tr>

          {/* Benefits & Memo */}
          <tr>
            <td className="p-4 sticky left-0 bg-white border-r border-stone-200 font-medium text-stone-600 z-10">혜택 / 메모</td>
            {venues.map(venue => (
              <td key={venue.id} className="p-4 border-r border-stone-100 last:border-0 align-top space-y-3">
                {venue.additionalBenefits && (
                  <div className="bg-rose-50 p-2 rounded text-xs text-rose-700">
                    <span className="font-bold block mb-1">🎁 혜택</span>
                    {venue.additionalBenefits}
                  </div>
                )}
                {venue.memo && (
                  <div className="bg-stone-50 p-2 rounded text-xs text-stone-600 italic">
                    "{venue.memo}"
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-fade-in safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-stone-200 bg-white shadow-sm z-10 safe-area-pt">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-stone-800 flex items-center gap-2">
            웨딩홀 비교 
            <span className="text-xs md:text-sm font-normal text-stone-500 bg-stone-100 px-2 py-1 rounded-lg">
              {venues.length}개
            </span>
          </h2>
        </div>
        <Button variant="ghost" onClick={onClose} className="hover:bg-stone-100 rounded-full p-2">
          <X size={24} />
        </Button>
      </div>

      {/* Simulator Bar */}
      <div className="bg-rose-50 px-4 md:px-6 py-3 md:py-4 border-b border-rose-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm md:text-base">
          <Calculator size={18} />
          <span>견적 시뮬레이터</span>
        </div>
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <label className="text-xs md:text-sm text-stone-600 whitespace-nowrap">하객 수</label>
          <input 
            type="range" 
            min="100" 
            max="1000" 
            step="10" 
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="flex-1 md:w-64 h-2 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="relative min-w-[80px] md:min-w-[100px]">
            <input 
              type="number" 
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-rose-200 focus:ring-rose-500 focus:border-rose-500 text-sm font-bold text-right"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-500">명</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      {isMobile && (
        <div className="bg-white border-b border-stone-200 px-2 py-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {MOBILE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-stone-50 p-4 md:p-8 safe-area-pb">
        {isMobile ? (
          <div className="max-w-lg mx-auto">
            {renderMobileTabContent()}
          </div>
        ) : (
          renderDesktopTable()
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between safe-area-pb-min">
          <button
            onClick={goToPrevTab}
            disabled={currentTabIndex === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              currentTabIndex === 0
                ? 'text-stone-300 cursor-not-allowed'
                : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
            }`}
          >
            <ChevronLeft size={16} />
            이전
          </button>
          
          <div className="flex gap-1">
            {MOBILE_TABS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentTabIndex ? 'bg-rose-500 w-4' : 'bg-stone-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goToNextTab}
            disabled={currentTabIndex === MOBILE_TABS.length - 1}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              currentTabIndex === MOBILE_TABS.length - 1
                ? 'text-stone-300 cursor-not-allowed'
                : 'text-white bg-rose-500 hover:bg-rose-600'
            }`}
          >
            다음
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
