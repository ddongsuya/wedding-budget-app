
// 식장 타입
export interface VenueImage {
  id: string;
  url: string;          // Base64 or URL
  caption: string;      // Image description
  order: number;        // Display order
  createdAt: string;
}

// 예식장 장비 옵션
export interface VenueEquipment {
  lighting: boolean;        // 조명
  videoProduction: boolean; // 영상연출
  bgmService: boolean;      // BGM 서비스
  confetti: boolean;        // 축포
  lightingMemo?: string;
  videoProductionMemo?: string;
  bgmServiceMemo?: string;
  confettiMemo?: string;
}

// 계약 특전
export interface VenueBenefits {
  hotelRoom: boolean;       // 호텔룸 제공
  hotelRoomMemo?: string;
  meals: boolean;           // 식사 제공
  mealsMemo?: string;
  weddingCake: boolean;     // 웨딩 케익
  weddingCakeMemo?: string;
  other?: string;           // 기타 특전
}

// 계약 정보
export interface VenueContract {
  // 행사 정보
  eventDateTime: string | null;     // 행사일시
  eventDateTimeMemo?: string;
  receptionHall: string;            // 피로연장
  receptionHallMemo?: string;
  
  // 인원 정보
  guaranteedGuests: number;         // 식사보증인원
  guaranteedGuestsMemo?: string;
  
  // 신랑/신부 정보
  groomName: string;
  groomContact: string;
  brideName: string;
  brideContact: string;
  coupleInfoMemo?: string;
  
  // 식사 정보
  mealCourseName: string;           // 식사 코스명
  mealCoursePrice: number;          // 식사 코스 가격
  mealCourseMemo?: string;
  
  // 주류 서비스
  alcoholServiceIncluded: boolean;  // 주류 서비스 제공 여부
  alcoholServicePrice: number;      // 주류 서비스 가격 (미포함 시)
  alcoholServiceMemo?: string;
  
  // 홀 대관료
  hallRentalFee: number;
  hallRentalFeeMemo?: string;
  
  // 혼구용품
  weddingSupplies: string;
  weddingSuppliesMemo?: string;
  
  // 식권
  mealTicketCount: number;          // 식권 개수
  mealTicketMemo?: string;
  
  // 예식장비
  equipment: VenueEquipment;
  
  // 폐백
  pyebaekIncluded: boolean;
  pyebaekPrice: number;
  pyebaekMemo?: string;
  
  // 특전
  benefits: VenueBenefits;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  rentalFee: number;
  sdmIncluded: boolean;
  studioFee: number;
  dressFee: number;
  makeupFee: number;
  mealCostPerPerson: number;
  minimumGuests: number;
  bouquetIncluded: boolean;
  bouquetFee: number;
  rehearsalMakeupIncluded: boolean;
  rehearsalMakeupFee: number;
  parkingSpaces: number;
  // 새로운 추가 옵션
  extraFittingFee: number;       // 드레스 추가피팅비
  weddingRobeFee: number;        // 예도 비용
  outdoorVenueFee: number;       // 야외식장 대관비 (추가)
  freshFlowerFee: number;        // 생화 추가
  additionalBenefits: string;
  memo: string;
  rating: number;
  visitDate: string | null;
  status: 'pending' | 'visited' | 'contracted' | 'excluded';
  images: VenueImage[];          // Array of venue images
  thumbnailImage: string | null; // ID of the thumbnail image
  // 계약 정보 (계약 완료 시)
  contract?: VenueContract;
  createdAt: string;
  updatedAt: string;
}

// 예산 카테고리 타입
export interface BudgetCategory {
  id: string;
  name: string;
  icon: string; // Icon name as string
  parentId: string | null;
  budgetAmount: number;
  spentAmount: number; // Added for convenience in UI
  color: string;
}

// 지출 타입
export interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paidBy: 'groom' | 'bride' | 'shared';
  vendorName: string;
  paymentType: 'deposit' | 'interim' | 'balance' | 'full';
  status: 'planned' | 'completed';
  receiptUrl: string | null;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

// 전체 예산 설정 타입
export interface BudgetSettings {
  totalBudget: number;
  groomRatio: number;  // 신랑측 분담 비율 (0-100)
  brideRatio: number;  // 신부측 분담 비율 (0-100)
  weddingDate: string;
  categories: BudgetCategory[];
}

// 체크리스트 타입
export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  period: 'D-180' | 'D-100' | 'D-60' | 'D-30' | 'D-7' | 'D-Day';
  isCompleted: boolean;
}

// 일정 타입
export interface ScheduleItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'meeting' | 'fitting' | 'payment' | 'other';
  memo?: string;
  location?: string;
}

export type ViewMode = 'card' | 'table';

// --- New Settings Types ---

export interface UserProfile {
  name: string;
  avatarUrl: string | null; // Base64 or URL
  birthday: string;
  contact: string;
}

export interface CoupleProfile {
  groom: UserProfile;
  bride: UserProfile;
  couplePhotoUrl: string | null;
  meetingDate: string;
  weddingDate: string; // Synced with BudgetSettings
  nickname: string;
}

export interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  currency: string;
  language: string;
}
