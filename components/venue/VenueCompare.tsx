
import React, { useState } from 'react';
import { Venue } from '../../types';
import { X, Calculator, Star, Check, Minus } from 'lucide-react';
import { Button } from '../ui/Button';

interface VenueCompareProps {
  venues: Venue[];
  onClose: () => void;
}

export const VenueCompare: React.FC<VenueCompareProps> = ({ venues, onClose }) => {
  const [guestCount, setGuestCount] = useState<number>(250);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const calculateTotal = (venue: Venue) => {
    // Basic logic: Rental + (Meal * Guests)
    let total = venue.rentalFee + (venue.mealCostPerPerson * Math.max(guestCount, venue.minimumGuests));
    
    // Add separate costs if not included
    if (!venue.sdmIncluded) {
      total += (venue.studioFee + venue.dressFee + venue.makeupFee);
    }
    if (!venue.bouquetIncluded) total += venue.bouquetFee;
    if (!venue.rehearsalMakeupIncluded) total += venue.rehearsalMakeupFee;
    
    return total;
  };

  // Find best values for highlighting (lowest price, highest rating)
  const totals = venues.map(v => calculateTotal(v));
  const minTotal = Math.min(...totals);
  
  const ratings = venues.map(v => v.rating);
  const _maxRating = Math.max(...ratings);

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            웨딩홀 상세 비교 
            <span className="text-sm font-normal text-stone-500 bg-stone-100 px-2 py-1 rounded-lg">
              {venues.length}개 선택됨
            </span>
          </h2>
        </div>
        <Button variant="ghost" onClick={onClose} className="hover:bg-stone-100 rounded-full p-2">
          <X size={24} />
        </Button>
      </div>

      {/* Simulator Bar */}
      <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-2 text-rose-700 font-bold">
          <Calculator size={20} />
          <span>견적 시뮬레이터</span>
        </div>
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <label className="text-sm text-stone-600 whitespace-nowrap">예상 하객 수</label>
          <input 
            type="range" 
            min="100" 
            max="1000" 
            step="10" 
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="w-full md:w-64 h-2 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="relative min-w-[100px]">
            <input 
              type="number" 
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full pl-3 pr-8 py-1.5 rounded-lg border-rose-200 focus:ring-rose-500 focus:border-rose-500 text-sm font-bold text-right"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">명</span>
          </div>
        </div>
        <p className="text-xs text-rose-600 hidden md:block">
          * 하객 수에 따라 총 견적이 실시간으로 다시 계산됩니다.
        </p>
      </div>

      {/* Comparison Table Container */}
      <div className="flex-1 overflow-auto bg-stone-50 p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden min-w-fit mx-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100">
                <th className="p-4 w-32 md:w-48 sticky left-0 bg-stone-100 border-r border-stone-200 text-left font-bold text-stone-600 z-10">
                  구분
                </th>
                {venues.map(venue => (
                  <th key={venue.id} className="p-4 min-w-[200px] md:min-w-[280px] text-left border-r border-stone-100 last:border-0 bg-stone-50">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-stone-800">{venue.name}</h3>
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
              {/* Total Estimate Row (Highlighted) */}
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
                      <p className="text-xl font-bold text-rose-600">{formatMoney(total)}</p>
                      {isCheapest && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded ml-1">최저가</span>}
                      <p className="text-xs text-stone-500 mt-1">
                        인당 {formatMoney(Math.round(total / guestCount))} 꼴
                      </p>
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
                    <p className="text-stone-700">{venue.location}</p>
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
      </div>
    </div>
  );
};
