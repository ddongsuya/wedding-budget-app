
import { Venue, BudgetSettings, Expense, BudgetCategory, ChecklistItem, ScheduleItem, CoupleProfile, AppSettings } from '../types';

const STORAGE_KEYS = {
  VENUES: 'wedding_app_venues',
  BUDGET: 'wedding_app_budget',
  EXPENSES: 'wedding_app_expenses',
  CHECKLIST: 'wedding_app_checklist',
  SCHEDULE: 'wedding_app_schedule',
  COUPLE: 'wedding_app_couple',
  SETTINGS: 'wedding_app_settings',
};

// Initial Data Seeding
const INITIAL_CATEGORIES: BudgetCategory[] = [
  { id: 'c1', name: '예식 관련', icon: 'Building', parentId: null, budgetAmount: 15000000, spentAmount: 0, color: '#f43f5e' }, // rose
  { id: 'c2', name: '스드메', icon: 'Camera', parentId: null, budgetAmount: 3500000, spentAmount: 0, color: '#ec4899' }, // pink
  { id: 'c3', name: '예물/예단', icon: 'Gem', parentId: null, budgetAmount: 5000000, spentAmount: 0, color: '#d946ef' }, // fuchsia
  { id: 'c4', name: '신혼집', icon: 'Home', parentId: null, budgetAmount: 200000000, spentAmount: 0, color: '#6366f1' }, // indigo 
  { id: 'c5', name: '신혼여행', icon: 'Plane', parentId: null, budgetAmount: 6000000, spentAmount: 0, color: '#8b5cf6' }, // violet
  { id: 'c6', name: '기타', icon: 'Gift', parentId: null, budgetAmount: 2000000, spentAmount: 0, color: '#64748b' }, // slate
];

const INITIAL_BUDGET: BudgetSettings = {
  totalBudget: 231500000,
  groomRatio: 50,
  brideRatio: 50,
  weddingDate: '2024-12-25',
  categories: INITIAL_CATEGORIES,
};

const INITIAL_COUPLE: CoupleProfile = {
  groom: { name: '신랑', avatarUrl: null, birthday: '1990-01-01', contact: '' },
  bride: { name: '신부', avatarUrl: null, birthday: '1992-01-01', contact: '' },
  couplePhotoUrl: null,
  meetingDate: '2020-01-01',
  weddingDate: '2024-12-25',
  nickname: '우리 결혼해요'
};

const INITIAL_SETTINGS: AppSettings = {
  darkMode: false,
  notifications: true,
  currency: 'KRW',
  language: 'ko',
};

const INITIAL_VENUES: Venue[] = [
  {
    id: 'v1',
    name: '더 채플 앳 논현',
    location: '서울 강남구',
    rentalFee: 4500000,
    sdmIncluded: false,
    studioFee: 1500000,
    dressFee: 2000000,
    makeupFee: 500000,
    mealCostPerPerson: 75000,
    minimumGuests: 250,
    bouquetIncluded: false,
    bouquetFee: 150000,
    rehearsalMakeupIncluded: false,
    rehearsalMakeupFee: 200000,
    parkingSpaces: 300,
    extraFittingFee: 0,
    weddingRobeFee: 0,
    outdoorVenueFee: 0,
    freshFlowerFee: 0,
    additionalBenefits: '포토테이블 서비스, 플라워 샤워 서비스',
    memo: '홀이 웅장하고 밥이 맛있다고 함. 주차가 조금 걱정.',
    rating: 4.5,
    visitDate: '2023-10-15',
    status: 'visited',
    images: [],
    thumbnailImage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'v2',
    name: '빌라드지디 수서',
    location: '서울 강남구',
    rentalFee: 8000000,
    sdmIncluded: true,
    studioFee: 0,
    dressFee: 0,
    makeupFee: 0,
    mealCostPerPerson: 95000,
    minimumGuests: 200,
    bouquetIncluded: true,
    bouquetFee: 0,
    rehearsalMakeupIncluded: false,
    rehearsalMakeupFee: 150000,
    parkingSpaces: 100,
    extraFittingFee: 0,
    weddingRobeFee: 0,
    outdoorVenueFee: 0,
    freshFlowerFee: 0,
    additionalBenefits: '하우스 웨딩 분위기, 단독홀 사용',
    memo: '너무 예쁜데 가격이 예산 초과...',
    rating: 5.0,
    visitDate: null,
    status: 'pending',
    images: [],
    thumbnailImage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: 'cl1', title: '양가 부모님 인사', period: 'D-180', isCompleted: true },
  { id: 'cl2', title: '웨딩홀 투어 및 예약', period: 'D-180', isCompleted: true },
  { id: 'cl3', title: '스드메 업체 선정', period: 'D-180', isCompleted: false },
  { id: 'cl4', title: '신혼여행지 결정 및 항공권 예약', period: 'D-100', isCompleted: false },
  { id: 'cl5', title: '웨딩 촬영', period: 'D-100', isCompleted: false },
  { id: 'cl6', title: '청첩장 주문', period: 'D-60', isCompleted: false },
  { id: 'cl7', title: '주례, 사회자, 축가 섭외', period: 'D-60', isCompleted: false },
  { id: 'cl8', title: '모바일 청첩장 제작', period: 'D-30', isCompleted: false },
  { id: 'cl9', title: '식전 영상 제작', period: 'D-30', isCompleted: false },
  { id: 'cl10', title: '본식 드레스 가봉', period: 'D-30', isCompleted: false },
  { id: 'cl11', title: '네일, 염색 등 미용', period: 'D-7', isCompleted: false },
  { id: 'cl12', title: '포토테이블 사진 준비', period: 'D-7', isCompleted: false },
];

const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: 's1', title: '웨딩홀 상담 (빌라드지디)', date: '2024-05-20', time: '14:00', type: 'meeting', location: '서울 강남구' },
  { id: 's2', title: '드레스 투어', date: '2024-06-15', time: '11:00', type: 'fitting', location: '청담동' },
];

export const StorageService = {
  // --- Budget ---
  getBudget: (): BudgetSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGET);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(INITIAL_BUDGET));
      return INITIAL_BUDGET;
    }
    return JSON.parse(data);
  },

  saveBudget: (budget: BudgetSettings) => {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
    
    // Sync wedding date to couple profile
    const couple = StorageService.getCoupleProfile();
    if (couple.weddingDate !== budget.weddingDate) {
      couple.weddingDate = budget.weddingDate;
      StorageService.saveCoupleProfile(couple);
    }
  },

  updateBudgetSettings: (settings: Partial<BudgetSettings>) => {
    const current = StorageService.getBudget();
    const updated = { ...current, ...settings };
    StorageService.saveBudget(updated);
    return updated;
  },

  // Category Management
  addCategory: (category: BudgetCategory) => {
    const budget = StorageService.getBudget();
    budget.categories.push(category);
    StorageService.saveBudget(budget);
    return budget;
  },

  updateCategory: (category: BudgetCategory) => {
    const budget = StorageService.getBudget();
    const index = budget.categories.findIndex(c => c.id === category.id);
    if (index !== -1) {
      budget.categories[index] = category;
      StorageService.saveBudget(budget);
    }
    return budget;
  },

  deleteCategory: (id: string) => {
    const budget = StorageService.getBudget();
    budget.categories = budget.categories.filter(c => c.id !== id);
    StorageService.saveBudget(budget);
    return budget;
  },

  // --- Venues ---
  getVenues: (): Venue[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VENUES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(INITIAL_VENUES));
      return INITIAL_VENUES;
    }
    const venues = JSON.parse(data);
    // Backward compatibility check for images
    return venues.map((v: any) => ({
      ...v,
      images: v.images || [],
      thumbnailImage: v.thumbnailImage || null
    }));
  },

  saveVenues: (venues: Venue[]) => {
    localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(venues));
  },

  addVenue: (venue: Venue) => {
    const venues = StorageService.getVenues();
    const newVenues = [venue, ...venues];
    StorageService.saveVenues(newVenues);
    return newVenues;
  },

  updateVenue: (venue: Venue) => {
    const venues = StorageService.getVenues();
    const index = venues.findIndex(v => v.id === venue.id);
    if (index !== -1) {
      venues[index] = venue;
      StorageService.saveVenues(venues);
    }
    return venues;
  },

  deleteVenue: (id: string) => {
    const venues = StorageService.getVenues();
    const newVenues = venues.filter(v => v.id !== id);
    StorageService.saveVenues(newVenues);
    return newVenues;
  },

  // --- Expenses ---
  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },

  addExpense: (expense: Expense) => {
    const expenses = StorageService.getExpenses();
    const newExpenses = [expense, ...expenses];
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));

    // Update Category Spent Amount
    const budget = StorageService.getBudget();
    const categoryIndex = budget.categories.findIndex(c => c.id === expense.categoryId);
    if (categoryIndex !== -1) {
      budget.categories[categoryIndex].spentAmount += expense.amount;
      StorageService.saveBudget(budget);
    }
    return newExpenses;
  },

  updateExpense: (expense: Expense) => {
    const expenses = StorageService.getExpenses();
    const oldExpenseIndex = expenses.findIndex(e => e.id === expense.id);
    if (oldExpenseIndex === -1) return expenses;

    const oldExpense = expenses[oldExpenseIndex];
    
    // Update Budget Categories if amount or category changed
    if (oldExpense.amount !== expense.amount || oldExpense.categoryId !== expense.categoryId) {
        const budget = StorageService.getBudget();
        
        // Remove from old category
        const oldCatIndex = budget.categories.findIndex(c => c.id === oldExpense.categoryId);
        if (oldCatIndex !== -1) {
            budget.categories[oldCatIndex].spentAmount -= oldExpense.amount;
        }

        // Add to new category
        const newCatIndex = budget.categories.findIndex(c => c.id === expense.categoryId);
        if (newCatIndex !== -1) {
            budget.categories[newCatIndex].spentAmount += expense.amount;
        }
        
        StorageService.saveBudget(budget);
    }

    expenses[oldExpenseIndex] = expense;
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return expenses;
  },

  deleteExpense: (id: string) => {
    const expenses = StorageService.getExpenses();
    const expense = expenses.find(e => e.id === id);
    
    if (expense) {
        const budget = StorageService.getBudget();
        const catIndex = budget.categories.findIndex(c => c.id === expense.categoryId);
        if (catIndex !== -1) {
            budget.categories[catIndex].spentAmount -= expense.amount;
            StorageService.saveBudget(budget);
        }
    }

    const newExpenses = expenses.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));
    return newExpenses;
  },

  // --- Checklist ---
  getChecklist: (): ChecklistItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(INITIAL_CHECKLIST));
      return INITIAL_CHECKLIST;
    }
    return JSON.parse(data);
  },

  saveChecklist: (checklist: ChecklistItem[]) => {
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(checklist));
  },

  toggleChecklistItem: (id: string) => {
    const items = StorageService.getChecklist();
    const updated = items.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item);
    StorageService.saveChecklist(updated);
    return updated;
  },

  addChecklistItem: (item: ChecklistItem) => {
    const items = StorageService.getChecklist();
    const updated = [...items, item];
    StorageService.saveChecklist(updated);
    return updated;
  },

  deleteChecklistItem: (id: string) => {
    const items = StorageService.getChecklist();
    const updated = items.filter(item => item.id !== id);
    StorageService.saveChecklist(updated);
    return updated;
  },

  // --- Schedule ---
  getSchedule: (): ScheduleItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(INITIAL_SCHEDULE));
      return INITIAL_SCHEDULE;
    }
    return JSON.parse(data);
  },

  saveSchedule: (schedule: ScheduleItem[]) => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  },

  addScheduleItem: (item: ScheduleItem) => {
    const schedule = StorageService.getSchedule();
    const updated = [...schedule, item];
    StorageService.saveSchedule(updated);
    return updated;
  },

  deleteScheduleItem: (id: string) => {
    const schedule = StorageService.getSchedule();
    const updated = schedule.filter(item => item.id !== id);
    StorageService.saveSchedule(updated);
    return updated;
  },

  // --- Couple Profile ---
  getCoupleProfile: (): CoupleProfile => {
    const data = localStorage.getItem(STORAGE_KEYS.COUPLE);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(INITIAL_COUPLE));
      return INITIAL_COUPLE;
    }
    return JSON.parse(data);
  },

  saveCoupleProfile: (profile: CoupleProfile) => {
    localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(profile));
    
    // Sync wedding date to budget settings
    const budget = StorageService.getBudget();
    if (budget.weddingDate !== profile.weddingDate) {
      budget.weddingDate = profile.weddingDate;
      StorageService.saveBudget(budget);
    }
  },

  // --- App Settings ---
  getAppSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return JSON.parse(data);
  },

  saveAppSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Data Management ---
  exportData: (): string => {
    const data = {
      budget: StorageService.getBudget(),
      venues: StorageService.getVenues(),
      expenses: StorageService.getExpenses(),
      checklist: StorageService.getChecklist(),
      schedule: StorageService.getSchedule(),
      couple: StorageService.getCoupleProfile(),
      settings: StorageService.getAppSettings(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.BUDGET);
    localStorage.removeItem(STORAGE_KEYS.VENUES);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CHECKLIST);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
    localStorage.removeItem(STORAGE_KEYS.COUPLE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    window.location.reload();
  }
};
