
// 식장 타입
export interface VenueImage {
  id: string;
  url: string;          // Base64 or URL
  caption: string;      // Image description
  order: number;        // Display order
  createdAt: string;
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
