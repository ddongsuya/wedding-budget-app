import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { Wallet, Calendar } from 'lucide-react';

export interface VenueExpenseSyncProps {
  venueId: string;
  venueName: string;
  contractAmount: number;
  visitDate?: string | null;
  onExpenseCreated: () => void;
  onEventCreated: () => void;
}

/**
 * 예식장 계약 확정 시 지출/일정 자동 등록 제안 컴포넌트
 * - 계약 확정 시 ConfirmDialog로 지출 자동 등록 제안 (Requirements 2.1)
 * - 방문 예정 식장에 일정 추가 제안 (Requirements 2.2)
 */
export const VenueExpenseSync: React.FC<VenueExpenseSyncProps> = ({
  venueId,
  venueName,
  contractAmount,
  visitDate,
  onExpenseCreated,
  onEventCreated,
}) => {
  const [showExpenseDialog, setShowExpenseDialog] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);

  const handleExpenseConfirm = () => {
    setShowExpenseDialog(false);
    onExpenseCreated();
    // 방문일이 있으면 일정 추가도 제안
    if (visitDate) {
      setShowEventDialog(true);
    }
  };

  const handleExpenseCancel = () => {
    setShowExpenseDialog(false);
    if (visitDate) {
      setShowEventDialog(true);
    }
  };

  const handleEventConfirm = () => {
    setShowEventDialog(false);
    onEventCreated();
  };

  const handleEventCancel = () => {
    setShowEventDialog(false);
  };

  return (
    <>
      {/* 지출 자동 등록 제안 다이얼로그 */}
      <ConfirmDialog
        isOpen={showExpenseDialog}
        onClose={handleExpenseCancel}
        onConfirm={handleExpenseConfirm}
        title="지출 자동 등록"
        message={`"${venueName}" 계약금 ${formatMoney(contractAmount)}을(를) 지출 내역에 자동으로 등록할까요?`}
        confirmLabel="등록하기"
        cancelLabel="나중에"
        variant="info"
      />

      {/* 일정 추가 제안 다이얼로그 */}
      <ConfirmDialog
        isOpen={showEventDialog}
        onClose={handleEventCancel}
        onConfirm={handleEventConfirm}
        title="방문 일정 추가"
        message={`"${venueName}" 방문 일정(${visitDate})을 캘린더에 추가할까요?`}
        confirmLabel="추가하기"
        cancelLabel="나중에"
        variant="info"
      />
    </>
  );
};

export default VenueExpenseSync;
