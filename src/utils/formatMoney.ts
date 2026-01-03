/**
 * 금액 포맷 유틸리티
 * 다양한 형식의 금액 표시 지원
 */

// 기본 원화 포맷 (₩1,000,000)
export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(amount);
};

// 축약 포맷 (100만원, 1억원)
export const formatMoneyShort = (amount: number): string => {
  if (amount >= 100000000) {
    const billions = amount / 100000000;
    return `${billions % 1 === 0 ? billions : billions.toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    const tenThousands = amount / 10000;
    return `${tenThousands % 1 === 0 ? tenThousands : tenThousands.toFixed(0)}만원`;
  }
  return `${amount.toLocaleString()}원`;
};

// 숫자만 포맷 (1,000,000)
export const formatNumber = (amount: number): string => {
  return amount.toLocaleString('ko-KR');
};

// 입력값에서 숫자만 추출
export const parseMoneyInput = (value: string): number => {
  const numericValue = value.replace(/[^0-9]/g, '');
  return numericValue === '' ? 0 : parseInt(numericValue, 10);
};

// 입력 중 실시간 포맷 (콤마 추가)
export const formatMoneyInput = (value: string): string => {
  const numericValue = value.replace(/[^0-9]/g, '');
  if (numericValue === '') return '';
  return parseInt(numericValue, 10).toLocaleString('ko-KR');
};

export default formatMoney;
