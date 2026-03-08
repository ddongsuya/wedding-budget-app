import React from 'react';
import { DollarSign, CalendarPlus } from 'lucide-react';

/**
 * 체크리스트 항목 완료 시 표시되는 바로가기 버튼
 * "관련 지출 등록" / "관련 일정 추가" 바로가기 제공
 *
 * Requirements: 3.1
 */
export interface ChecklistActionLinksProps {
  itemId: string;
  itemTitle: string;
  onAddExpense: () => void;
  onAddEvent: () => void;
}

export const ChecklistActionLinks: React.FC<ChecklistActionLinksProps> = ({
  itemId,
  itemTitle,
  onAddExpense,
  onAddEvent,
}) => {
  return (
    <div className="flex gap-2 mt-2" data-testid={`action-links-${itemId}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddExpense();
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
        title={`${itemTitle} 관련 지출 등록`}
      >
        <DollarSign size={12} />
        지출 등록
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddEvent();
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        title={`${itemTitle} 관련 일정 추가`}
      >
        <CalendarPlus size={12} />
        일정 추가
      </button>
    </div>
  );
};
