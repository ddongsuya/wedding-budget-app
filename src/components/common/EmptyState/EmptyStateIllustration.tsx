import React from 'react';

interface EmptyStateIllustrationProps {
  type: 'wedding' | 'budget' | 'expense' | 'venue' | 'checklist' | 'calendar' | 'photo' | 'notification';
  className?: string;
}

export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({ type, className = '' }) => {
  const illustrations = {
    // 결혼/웨딩 일러스트
    wedding: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="50" fill="#FFF1F2" />
        <path d="M60 30C48 30 40 42 40 52C40 72 60 85 60 85C60 85 80 72 80 52C80 42 72 30 60 30Z" fill="#FDA4AF" />
        <circle cx="50" cy="50" r="3" fill="#FFF" />
        <path d="M45 70L60 90L75 70" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
        <circle cx="35" cy="35" r="8" fill="#FEE2E2" />
        <circle cx="85" cy="35" r="8" fill="#FEE2E2" />
        <path d="M32 32L38 38M82 32L88 38" stroke="#FECACA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    
    // 예산 일러스트
    budget: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="50" fill="#FEF3C7" />
        <rect x="35" y="40" width="50" height="35" rx="4" fill="#FCD34D" />
        <rect x="40" y="45" width="40" height="8" rx="2" fill="#FEF3C7" />
        <rect x="40" y="57" width="25" height="6" rx="2" fill="#FEF3C7" />
        <circle cx="75" cy="75" r="15" fill="#F59E0B" />
        <path d="M75 68V82M69 75H81" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 50L25 45M90 50L95 45" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    
    // 지출 일러스트
    expense: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="50" fill="#ECFDF5" />
        <rect x="30" y="35" width="60" height="50" rx="6" fill="#6EE7B7" />
        <rect x="35" y="42" width="30" height="4" rx="2" fill="#FFF" />
        <rect x="35" y="50" width="20" height="3" rx="1" fill="#FFF" opacity="0.7" />
        <circle cx="75" cy="55" r="12" fill="#10B981" />
        <path d="M75 50V60M70 55H80" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
        <rect x="35" y="62" width="50" height="15" rx="3" fill="#D1FAE5" />
        <path d="M40 67H55M40 72H50" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    
    // 식장 일러스트
    venue: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="50" fill="#FFF1F2" />
        <path d="M30 80V50L60 30L90 50V80H30Z" fill="#FECDD3" />
        <rect x="50" y="55" width="20" height="25" fill="#FFF" />
        <path d="M60 30L30 50H90L60 30Z" fill="#FDA4AF" />
        <circle cx="60" cy="45" r="5" fill="#FFF" />
        <path d="M45 80V70C45 67 48 65 52 65H68C72 65 75 67 75 70V80" fill="#F9A8D4" />
        <circle cx="40" cy="25" r="3" fill="#FEE2E2" />
        <circle cx="80" cy="25" r="3" fill="#FEE2E2" />
        <path d="M25 85H95" stroke="#FECACA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    
    // 체크리스트 일러스트
    checklist: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="50" fill="#EDE9FE" />
        <rect x="35" y="25" width="50" height="70" rx="6" fill="#C4B5FD" />
        <rect x="40" y="35" width="40" height="8" rx="2" fill="#FFF" />
        <rect x="40" y="48" width="35" height="6" rx="2" fill="#FFF" opacity="0.7" />
        <rect x="40" y="58" width="30" height="6" rx="2" fill="#FFF" opacity="0.7" />
        <rect x="40" y="68" width="35" height="6" rx="2" fill="#FFF" opacity="0.7" />
        <rect x="40" y="78" width="25" height="6" rx="2" fill="#FFF" opacity="0.7" />
        <circle cx="80" cy="75" r="15" fill="#8B5CF6" />
        <path d="M74 75L78 79L86 71" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    
    // 캘린더 일러스트
    calendar: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="50" fill="#DBEAFE" />
        <rect x="30" y="35" width="60" height="55" rx="6" fill="#93C5FD" />
        <rect x="30" y="35" width="60" height="15" rx="6" fill="#3B82F6" />
        <rect x="40" y="30" width="4" height="12" rx="2" fill="#1E40AF" />
        <rect x="76" y="30" width="4" height="12" rx="2" fill="#1E40AF" />
        <rect x="38" y="58" width="10" height="10" rx="2" fill="#FFF" />
        <rect x="55" y="58" width="10" height="10" rx="2" fill="#FFF" />
        <rect x="72" y="58" width="10" height="10" rx="2" fill="#FFF" />
        <rect x="38" y="73" width="10" height="10" rx="2" fill="#FFF" />
        <rect x="55" y="73" width="10" height="10" rx="2" fill="#FDA4AF" />
        <rect x="72" y="73" width="10" height="10" rx="2" fill="#FFF" />
        <circle cx="60" cy="78" r="3" fill="#E11D48" />
      </svg>
    ),

    // 사진 일러스트
    photo: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="50" fill="#FEE2E2" />
        <rect x="30" y="35" width="60" height="50" rx="6" fill="#FECACA" />
        <circle cx="50" cy="55" r="10" fill="#FDA4AF" />
        <path d="M35 75L50 60L65 75L80 55L85 75" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="75" cy="45" r="5" fill="#FFF" />
      </svg>
    ),

    // 알림 일러스트
    notification: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className}>
        <circle cx="60" cy="60" r="50" fill="#FEF3C7" />
        <path d="M60 30C48 30 38 40 38 52V65L32 75H88L82 65V52C82 40 72 30 60 30Z" fill="#FCD34D" />
        <circle cx="60" cy="85" r="8" fill="#F59E0B" />
        <circle cx="75" cy="35" r="10" fill="#EF4444" />
        <path d="M72 35H78M75 32V38" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };

  return illustrations[type] || null;
};
