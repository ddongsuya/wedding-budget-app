import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, PieChart, List, Clock } from 'lucide-react';
import { BudgetSettings, Expense } from '@/types/types';
import { DashboardSkeleton } from '@/components/skeleton/DashboardSkeleton';
import { useCoupleProfile } from '@/hooks/useCoupleProfile';
import { useBudget } from '@/hooks/useBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { checklistAPI } from '@/api/checklist';
import { eventAPI } from '@/api/events';

// 프로페셔널 대시보드 컴포넌트
import { CompactHeader } from '../components/dashboard/CompactHeader';
import { KPIGrid } from '../components/dashboard/KPICards';
import { BudgetDonutChart } from '../components/dashboard/BudgetInsights';
import { CategoryBars } from '../components/dashboard/CategoryBars';
import { RecentActivityGrid } from '../components/dashboard/RecentActivity';

// 탭 타입 정의
type DashboardTab = 'overview' | 'category' | 'activity';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile: apiProfile, loading: profileLoading } = useCoupleProfile();
  const { settings: budgetSettings, categories, loading: budgetLoading } = useBudget();
  const { expenses: apiExpenses, loading: expensesLoading } = useExpenses();
  
  // 모바일 탭 상태
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // 체크리스트 진행률 상태
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [checklistLoading, setChecklistLoading] = useState(true);
  
  // 다가오는 일정 상태
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [_eventsLoading, setEventsLoading] = useState(true);
  
  // 체크리스트와 일정을 병렬로 로드
  useEffect(() => {
    const loadAdditionalData = async () => {
      // 병렬로 두 API 호출
      const [checklistResult, eventsResult] = await Promise.allSettled([
        checklistAPI.getStats(),
        eventAPI.getUpcoming(),
      ]);
      
      // 체크리스트 결과 처리
      if (checklistResult.status === 'fulfilled') {
        setChecklistProgress(checklistResult.value.data.data?.completionRate || 0);
      } else {
        console.error('Failed to load checklist stats:', checklistResult.reason);
        setChecklistProgress(0);
      }
      setChecklistLoading(false);
      
      // 일정 결과 처리
      if (eventsResult.status === 'fulfilled') {
        const events = (eventsResult.value.data.data || []).slice(0, 3).map((e: any) => ({
          id: e.id,
          title: e.title,
          date: e.start_date,
          time: e.start_time,
          category: e.category,
          color: e.color,
        }));
        setUpcomingEvents(events);
      } else {
        console.error('Failed to load upcoming events:', eventsResult.reason);
        setUpcomingEvents([]);
      }
      setEventsLoading(false);
    };
    
    loadAdditionalData();
  }, []);
  
  // API 프로필을 대시보드에서 사용하는 형식으로 변환
  const profile = apiProfile ? {
    groom: {
      name: apiProfile.groom_name || '신랑',
      avatarUrl: apiProfile.groom_image || null,
    },
    bride: {
      name: apiProfile.bride_name || '신부',
      avatarUrl: apiProfile.bride_image || null,
    },
    weddingDate: apiProfile.wedding_date || '',
    meetingDate: apiProfile.first_met_date || '',
    nickname: apiProfile.couple_nickname || '',
    couplePhotoUrl: apiProfile.couple_photo || null,
  } : {
    groom: { name: '신랑', avatarUrl: null },
    bride: { name: '신부', avatarUrl: null },
    weddingDate: '',
    meetingDate: '',
    nickname: '',
    couplePhotoUrl: null,
  };

  // API 데이터를 기존 형식으로 변환
  const budget: BudgetSettings = budgetSettings ? {
    totalBudget: budgetSettings.total_budget || 0,
    groomRatio: budgetSettings.groom_ratio || 50,
    brideRatio: budgetSettings.bride_ratio || 50,
    weddingDate: profile.weddingDate || '',
    categories: categories.map(c => ({
      id: String(c.id),
      name: c.name,
      icon: c.icon || '📦',
      parentId: null,
      budgetAmount: c.budget_amount || 0,
      spentAmount: c.spent_amount || 0,
      color: c.color || '#f43f5e',
    })),
  } : {
    totalBudget: 0,
    groomRatio: 50,
    brideRatio: 50,
    weddingDate: '',
    categories: [],
  };

  // API 지출 데이터를 기존 형식으로 변환
  const expenses: Expense[] = (apiExpenses as any[])?.map((e: any) => ({
    id: String(e.id),
    categoryId: String(e.category_id || ''),
    title: e.title,
    amount: e.amount,
    paymentDate: e.date,
    paidBy: (e.payer || 'shared') as 'groom' | 'bride' | 'shared',
    status: 'completed' as const,
    paymentMethod: (e.payment_method || 'card') as 'cash' | 'card' | 'transfer',
    paymentType: 'full' as const,
    vendorName: e.vendor || '',
    receiptUrl: null,
    memo: e.notes || '',
    createdAt: e.created_at || new Date().toISOString(),
    updatedAt: e.updated_at || new Date().toISOString(),
  })) || [];

  // 핵심 데이터만 로드되면 화면 표시 (체크리스트, 일정은 나중에 로드)
  const coreLoading = profileLoading || budgetLoading || expensesLoading;

  // 날짜 계산 함수
  const calculateDays = useCallback((targetDate: string) => {
    if (!targetDate) return 0;
    const today = new Date();
    const start = new Date(today.toISOString().split('T')[0]).getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - start;
    return Math.ceil(diff / (1000 * 3600 * 24));
  }, []);

  // Memoized Calculations
  const { totalSpent, overBudgetCategories } = useMemo(() => {
    const total = budget.categories.reduce((acc: number, cat: { spentAmount: number }) => acc + cat.spentAmount, 0);
    const overBudget = budget.categories.filter((c: { spentAmount: number; budgetAmount: number; name: string }) => c.spentAmount > c.budgetAmount && c.budgetAmount > 0);
    return { totalSpent: total, overBudgetCategories: overBudget };
  }, [budget.categories]);

  // Recent Expenses
  const recentExpenses = useMemo(() => 
    [...expenses]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        date: e.paymentDate,
        paidBy: e.paidBy,
        paymentMethod: e.paymentMethod,
      })),
    [expenses]
  );

  // D-day calculation
  const dDay = useMemo(() => calculateDays(profile.weddingDate), [profile.weddingDate, calculateDays]);

  // 카테고리 데이터 변환
  const categoryData = useMemo(() => 
    budget.categories.map((cat: { name: string; budgetAmount: number; spentAmount: number; color: string; icon: string }) => ({
      name: cat.name,
      budget: cat.budgetAmount,
      spent: cat.spentAmount,
      color: cat.color,
      icon: cat.icon,
    })),
    [budget.categories]
  );

  if (coreLoading) return <DashboardSkeleton />;

  // 탭 설정
  const tabs = [
    { id: 'overview' as const, label: '요약', icon: PieChart },
    { id: 'category' as const, label: '카테고리', icon: List },
    { id: 'activity' as const, label: '활동', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        
        {/* 컴팩트 헤더 */}
        <CompactHeader
          groomName={profile.groom.name}
          brideName={profile.bride.name}
          groomAvatar={profile.groom.avatarUrl}
          brideAvatar={profile.bride.avatarUrl}
          coupleNickname={profile.nickname}
          dDay={dDay}
          weddingDate={profile.weddingDate ? new Date(profile.weddingDate).toLocaleDateString('ko-KR') : undefined}
        />

        {/* 메인 콘텐츠 */}
        <div className="space-y-4 md:space-y-6">
          
          {/* 예산 초과 알림 */}
          {overBudgetCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="text-red-500 w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-red-700 text-xs md:text-sm">예산 초과 {overBudgetCategories.length}개 항목</h4>
                <p className="text-[10px] md:text-xs text-red-600 truncate">
                  {overBudgetCategories.map(c => c.name).join(', ')}
                </p>
              </div>
              <NavLink to="/budget" className="text-xs text-red-600 hover:text-red-700 flex items-center gap-0.5 flex-shrink-0">
                확인 <ArrowRight size={12} />
              </NavLink>
            </motion.div>
          )}

          {/* KPI 카드 그리드 - 항상 표시 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <KPIGrid 
              dDay={dDay}
              totalBudget={budget.totalBudget}
              spent={totalSpent}
              checklistProgress={checklistProgress}
              overBudgetCount={overBudgetCategories.length}
              checklistLoading={checklistLoading}
              groomRatio={budget.groomRatio}
              brideRatio={budget.brideRatio}
            />
          </motion.section>

          {/* 모바일 탭 네비게이션 */}
          <div className="lg:hidden">
            <div className="flex bg-white rounded-xl border border-stone-200/60 p-1 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 모바일: 탭 콘텐츠 */}
          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <BudgetDonutChart 
                    categories={categoryData}
                    totalBudget={budget.totalBudget}
                    totalSpent={totalSpent}
                  />
                </motion.div>
              )}
              
              {activeTab === 'category' && (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CategoryBars 
                    categories={categoryData}
                    onCategoryClick={(name) => navigate(`/budget?category=${name}`)}
                  />
                </motion.div>
              )}
              
              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <RecentActivityGrid 
                    expenses={recentExpenses}
                    events={upcomingEvents}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 데스크톱: 기존 레이아웃 유지 */}
          <div className="hidden lg:block space-y-6">
            {/* 예산 시각화 (2열) */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-5 gap-6"
            >
              {/* 도넛 차트 (2칸) */}
              <div className="col-span-2">
                <BudgetDonutChart 
                  categories={categoryData}
                  totalBudget={budget.totalBudget}
                  totalSpent={totalSpent}
                />
              </div>

              {/* 카테고리 바 (3칸) */}
              <div className="col-span-3">
                <CategoryBars 
                  categories={categoryData}
                  onCategoryClick={(name) => navigate(`/budget?category=${name}`)}
                />
              </div>
            </motion.section>

            {/* 최근 활동 & 일정 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RecentActivityGrid 
                expenses={recentExpenses}
                events={upcomingEvents}
              />
            </motion.section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
