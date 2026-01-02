import apiClient from './client';

export interface VenueContract {
  id: number;
  venue_id: number;
  couple_id: number;
  venue_name?: string;
  venue_location?: string;
  
  // 행사 관련
  event_datetime: string | null;
  event_datetime_memo: string | null;
  event_location: string | null;
  event_location_memo: string | null;
  reception_hall: string | null;
  reception_hall_memo: string | null;
  guaranteed_guests: number;
  guaranteed_guests_memo: string | null;
  meal_ticket_count: number;
  meal_ticket_memo: string | null;
  
  // 신랑/신부 정보
  groom_name: string | null;
  groom_contact: string | null;
  bride_name: string | null;
  bride_contact: string | null;
  couple_info_memo: string | null;
  
  // 식사 관련
  meal_course_name: string | null;
  meal_course_price: number;
  meal_total_price: number;
  meal_course_memo: string | null;
  alcohol_service_included: boolean;
  alcohol_service_price: number;
  alcohol_service_memo: string | null;
  
  // 대관 관련
  hall_rental_fee: number;
  hall_rental_fee_memo: string | null;
  hall_rental_fee_status: 'pending' | 'completed';
  wedding_supplies: string | null;
  wedding_supplies_fee: number;
  wedding_supplies_memo: string | null;
  wedding_supplies_status: 'pending' | 'completed';
  
  // 장비
  equipment_lighting: boolean;
  equipment_lighting_fee: number;
  equipment_lighting_memo: string | null;
  equipment_video: boolean;
  equipment_video_fee: number;
  equipment_video_memo: string | null;
  equipment_bgm: boolean;
  equipment_bgm_fee: number;
  equipment_bgm_memo: string | null;
  equipment_confetti: boolean;
  equipment_confetti_fee: number;
  equipment_confetti_memo: string | null;
  equipment_status: 'pending' | 'completed';
  
  // 폐백
  pyebaek_included: boolean;
  pyebaek_fee: number;
  pyebaek_memo: string | null;
  pyebaek_status: 'pending' | 'completed';
  
  // 특전
  benefit_hotel_room: boolean;
  benefit_hotel_room_memo: string | null;
  benefit_meals: boolean;
  benefit_meals_memo: string | null;
  benefit_wedding_cake: boolean;
  benefit_wedding_cake_memo: string | null;
  benefit_other: string | null;
  
  // 계약
  deposit_amount: number;
  deposit_paid: boolean;
  deposit_paid_date: string | null;
  deposit_memo: string | null;
  date_change_condition: string | null;
  cancellation_penalty: string | null;
  contract_memo: string | null;
  
  // 메타
  total_contract_amount: number;
  total_paid_amount: number;
  created_at: string;
  updated_at: string;
}

export interface ContractExpense {
  id: number;
  contract_id: number;
  expense_id: number | null;
  expense_type: string;
  amount: number;
  status: 'pending' | 'completed';
  due_date: string | null;
  paid_date: string | null;
  memo: string | null;
  expense_title?: string;
  expense_amount?: number;
  expense_date?: string;
}

export interface ContractInput {
  // 행사 관련
  event_datetime?: string;
  event_datetime_memo?: string;
  event_location?: string;
  event_location_memo?: string;
  reception_hall?: string;
  reception_hall_memo?: string;
  guaranteed_guests?: number;
  guaranteed_guests_memo?: string;
  meal_ticket_count?: number;
  meal_ticket_memo?: string;
  groom_name?: string;
  groom_contact?: string;
  bride_name?: string;
  bride_contact?: string;
  couple_info_memo?: string;
  
  // 식사 관련
  meal_course_name?: string;
  meal_course_price?: number;
  meal_total_price?: number;
  meal_course_memo?: string;
  alcohol_service_included?: boolean;
  alcohol_service_price?: number;
  alcohol_service_memo?: string;
  
  // 대관 관련
  hall_rental_fee?: number;
  hall_rental_fee_memo?: string;
  hall_rental_fee_status?: 'pending' | 'completed';
  wedding_supplies?: string;
  wedding_supplies_fee?: number;
  wedding_supplies_memo?: string;
  wedding_supplies_status?: 'pending' | 'completed';
  
  // 장비
  equipment_lighting?: boolean;
  equipment_lighting_fee?: number;
  equipment_lighting_memo?: string;
  equipment_video?: boolean;
  equipment_video_fee?: number;
  equipment_video_memo?: string;
  equipment_bgm?: boolean;
  equipment_bgm_fee?: number;
  equipment_bgm_memo?: string;
  equipment_confetti?: boolean;
  equipment_confetti_fee?: number;
  equipment_confetti_memo?: string;
  equipment_status?: 'pending' | 'completed';
  
  // 폐백
  pyebaek_included?: boolean;
  pyebaek_fee?: number;
  pyebaek_memo?: string;
  pyebaek_status?: 'pending' | 'completed';
  
  // 특전
  benefit_hotel_room?: boolean;
  benefit_hotel_room_memo?: string;
  benefit_meals?: boolean;
  benefit_meals_memo?: string;
  benefit_wedding_cake?: boolean;
  benefit_wedding_cake_memo?: string;
  benefit_other?: string;
  
  // 계약
  deposit_amount?: number;
  deposit_paid?: boolean;
  deposit_paid_date?: string;
  deposit_memo?: string;
  date_change_condition?: string;
  cancellation_penalty?: string;
  contract_memo?: string;
}

export const venueContractAPI = {
  // 계약된 식장 목록
  getContracted: () => apiClient.get('/venue-contracts/contracted'),
  
  // 특정 식장 계약 정보
  get: (venueId: string) => apiClient.get(`/venue-contracts/${venueId}`),
  
  // 계약 생성/수정
  upsert: (venueId: string, data: ContractInput) => 
    apiClient.post(`/venue-contracts/${venueId}`, data),
  
  // 계약 삭제
  delete: (venueId: string) => apiClient.delete(`/venue-contracts/${venueId}`),
  
  // 계약 지출 항목 추가/수정
  upsertExpense: (venueId: string, data: {
    expense_type: string;
    amount?: number;
    status?: 'pending' | 'completed';
    due_date?: string;
    paid_date?: string;
    memo?: string;
    expense_id?: number;
  }) => apiClient.post(`/venue-contracts/${venueId}/expenses`, data),
};
