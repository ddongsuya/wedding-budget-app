export type EventCategory = 'venue_visit' | 'fitting' | 'meeting' | 'payment' | 'other';

export interface CalendarEvent {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  
  // 날짜/시간
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  is_all_day: boolean;
  
  // 카테고리 및 스타일
  category: EventCategory | null;
  color: string;
  icon: string | null;
  
  // 위치
  location: string | null;
  location_url: string | null;
  
  // 알림
  reminder_minutes: number | null;
  
  // 연결
  linked_venue_id: string | null;
  linked_checklist_id: string | null;
  linked_expense_id: string | null;
  venue_name?: string;
  checklist_title?: string;
  
  // 담당자
  assigned_to: 'groom' | 'bride' | 'both';
  
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  start_date: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  is_all_day?: boolean;
  category?: EventCategory;
  color?: string;
  location?: string;
  location_url?: string;
  reminder_minutes?: number;
  linked_venue_id?: string;
  linked_checklist_id?: string;
  assigned_to?: 'groom' | 'bride' | 'both';
}

// 카테고리 정보
export const EVENT_CATEGORIES: Record<EventCategory, { label: string; icon: string; color: string }> = {
  venue_visit: { label: '식장 방문', icon: '💒', color: '#FDA4AF' },
  fitting: { label: '피팅/리허설', icon: '👰', color: '#F9A8D4' },
  meeting: { label: '미팅/상담', icon: '🤝', color: '#93C5FD' },
  payment: { label: '결제/계약', icon: '💳', color: '#FCD34D' },
  other: { label: '기타', icon: '📅', color: '#C4B5FD' },
};
