import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, PieChart, List, Clock, CreditCard, CheckSquare, Building2, Users } from 'lucide-react';
import { BudgetSettings, Expense } from '@/types/types';
import { DashboardSkeleton } from '@/components/skeleton/DashboardSkeleton';
import { useCoupleProfile } from '@/hooks/useCoupleProfile';
import { useBudget } from '@/hooks/useBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { useVenues } from '@/hooks/useVenues';
import { useCoupleSync } from '@/hooks/useCoupleSync';
import { checklistAPI } from '@/api/checklist';
import { eventAPI } from '@/api/events';
import { navigateCrossLink } from '@/utils/crossLink';
import { getUpcomingEvents, getPlannedExpenses, getUrgentChecklist } from '@/utils/dashboardFilters';
import type { ChecklistItem } from '@/types/checklist';

// 프로페셔널 대시보드 컴포넌트
import { CompactHeader } from '../components/dashboard/CompactHeader';
import { KPIGrid } from '../components/dashboard/KPICards';
import { BudgetDonutChart } from '../components/dashboard/BudgetInsights';
import { CategoryBars } from '../components/dashboard/CategoryBars';
import { RecentActivityGrid } from '../components/dashboard/RecentActivity';
import { PageTip } from '@/components/common/PageTip/PageTip';

// 탭 타입 정의
type DashboardTab = 'overview' | 'category' | 'activity';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile: apiProfile, loading: profileLoading } = useCoupleProfile();
  const { settings: budgetSettings, categories, loading: budgetLoading } = useBudget();
  const { expenses: apiExpenses, loading: expensesLoading } = useExpenses();
  const { venues, loading: venuesLoading } = useVenues();
  const { partnerLastActivity, isConnected: partnerConnected } = useCoupleSync();
  
  // 모바일 탭 상태
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // 체크리스트 진행률 상태
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [checklistLoading, setChecklistLoading] = useState(true);
  
  // 다가오는 일정 상태
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [_eventsLoading, setEventsLoading] = useState(true);
  
  // 체크리스트 항목 상태 (마감 임박 위젯용)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  
  // 체크리스트와 일정을 병렬로 로드
  useEffect(() => {
    const loadAdditionalData = async () => {
      // 병렬로 세 API 호출
      const [checklistResult, eventsResult, checklistItemsResult] = await Promise.allSettled([
        checklistAPI.getStats(),
        eventAPI.getUpcoming(),
        checklistAPI.getItems(),
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
      
      // 체크리스트 항목 결과 처리
      if (checklistItemsResult.status === 'fulfilled') {
        setChecklistItems(checklistItemsResult.value.data.data || []);
      } else {
        setChecklistItems([]);
      }
    };
    
    loadAdditionalData();
  }, []);

  // 결혼 예정일 변경 시 대시보드 데이터 갱신 (D-day 등)
  useEffect(() => {
    const handleWeddingDateChanged = () => {
      // useCoupleProfile이 profile-updated도 수신하므로 D-day가 자동 갱신됨
      // 체크리스트/일정 데이터도 다시 로드
      const reloadData = async () => {
        const [checklistResult, checklistItemsResult] = await Promise.allSettled([
          checklistAPI.getStats(),
          checklistAPI.getItems(),
        ]);
        if (checklistResult.status === 'fulfilled') {
          setChecklistProgress(checklistResult.value.data.data?.completionRate || 0);
        }
        if (checklistItemsResult.status === 'fulfilled') {
          setChecklistItems(checklistItemsResult.value.data.data || []);
        }
      };
      reloadData();
    };
    window.addEventListener('wedding-date-changed', handleWeddingDateChanged);
    return () => {
      window.removeEventListener('wedding-date-changed', handleWeddingDateChanged);
    };
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
    dueDate: e.due_date || null,
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

  // 결제 예정 지출 (status=planned)
  const plannedExpenses = useMemo(() => {
    const allExpenses = (apiExpenses as any[])?.map((e: any) => ({
      id: String(e.id),
      title: e.title,
      amount: e.amount,
      status: (e.status || 'completed') as 'planned' | 'completed',
      dueDate: e.due_date || null,
    })) || [];
    return getPlannedExpenses(allExpenses);
  }, [apiExpenses]);

  // 마감 임박 체크리스트
  const urgentChecklistItems = useMemo(() => {
    return getUrgentChecklist(checklistItems, dDay, 3);
  }, [checklistItems, dDay]);

  // 예식장 확정 여부
  const venueConfirmed = useMemo(() => {
    return venues.some((v: any) => v.status === 'contracted');
  }, [venues]);

  // 파트너 최근 활동 표시 텍스트
  const partnerActivityText = useMemo(() => {
    if (!partnerConnected || !partnerLastActivity) return null;
    const activityDate = new Date(partnerLastActivity);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전 활동';
    if (diffMin < 60) return `${diffMin}분 전 활동`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}시간 전 활동`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전 활동`;
  }, [partnerConnected, partnerLastActivity]);

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
        <PageTip pageKey="dashboard" />
        
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
                <div className="flex flex-wrap gap-1 mt-1">
                  {overBudgetCategories.map((c: any) => (
                    <button
                      key={c.id || c.name}
                      onClick={() => navigateCrossLink(navigate, {
                        target: '/expenses',
                        filter: { category_id: String(c.id) },
                      })}
                      className="text-[10px] md:text-xs text-red-600 hover:text-red-800 underline cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
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
              onBudgetClick={() => navigate('/budget')}
              onChecklistClick={() => navigate('/checklist')}
              onOverBudgetClick={() => navigate('/budget')}
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
                  className="space-y-4"
                >
                  <RecentActivityGrid 
                    expenses={recentExpenses}
                    events={upcomingEvents}
                  />

                  {/* 결제 예정 지출 */}
                  <div className="bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-stone-800 text-sm flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                        결제 예정
                      </h3>
                      <NavLink to="/expenses?tab=planned" className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-0.5">
                        전체 보기 <ArrowRight size={12} />
                      </NavLink>
                    </div>
                    <div className="space-y-2">
                      {plannedExpenses.length > 0 ? plannedExpenses.slice(0, 3).map((expense) => (
                        <div
                          key={expense.id}
                          onClick={() => navigateCrossLink(navigate, { target: '/expenses', filter: { id: expense.id } })}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-stone-700 truncate">{expense.title}</p>
                            {expense.dueDate && (
                              <p className="text-[10px] text-stone-400">{expense.dueDate}</p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-amber-600 flex-shrink-0 ml-2">
                            {new Intl.NumberFormat('ko-KR', { notation: 'compact' }).format(expense.amount)}
                          </span>
                        </div>
                      )) : (
                        <p className="text-xs text-stone-400 text-center py-3">결제 예정 항목이 없어요</p>
                      )}
                    </div>
                  </div>

                  {/* 마감 임박 체크리스트 */}
                  <div className="bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-stone-800 text-sm flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                        마감 임박
                      </h3>
                      <NavLink to="/checklist" className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-0.5">
                        전체 보기 <ArrowRight size={12} />
                      </NavLink>
                    </div>
                    <div className="space-y-2">
                      {urgentChecklistItems.length > 0 ? urgentChecklistItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => navigate('/checklist')}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
                        >
                          <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                            {item.due_period}
                          </span>
                          <p className="text-xs text-stone-700 truncate">{item.title}</p>
                        </div>
                      )) : (
                        <p className="text-xs text-stone-400 text-center py-3">마감 임박 항목이 없어요</p>
                      )}
                    </div>
                  </div>

                  {/* 예식장 확정 여부 & 파트너 활동 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-2xl border p-3 shadow-sm ${venueConfirmed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-stone-200/60'}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className={`w-3.5 h-3.5 ${venueConfirmed ? 'text-emerald-600' : 'text-stone-400'}`} />
                        <span className="text-xs font-bold text-stone-800">예식장</span>
                      </div>
                      {venueConfirmed ? (
                        <p className="text-xs text-emerald-700">✅ 확정됨</p>
                      ) : (
                        <button
                          onClick={() => navigate('/venues')}
                          className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-0.5"
                        >
                          확인하기 <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-stone-200/60 p-3 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Users className={`w-3.5 h-3.5 ${partnerConnected ? 'text-blue-500' : 'text-stone-400'}`} />
                        <span className="text-xs font-bold text-stone-800">파트너</span>
                      </div>
                      {partnerConnected ? (
                        <div>
                          <p className="text-xs text-stone-600">{partnerActivityText || '활동 없음'}</p>
                          <span className="text-[10px] text-emerald-600">● 연결됨</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate('/couple/connect')}
                          className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-0.5"
                        >
                          연결하기 <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  </div>
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

            {/* 결제 예정 / 마감 임박 체크리스트 / 예식장 확정 / 파트너 활동 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-6"
            >
              {/* 결제 예정 지출 */}
              <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    결제 예정
                  </h3>
                  <NavLink to="/expenses?tab=planned" className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-0.5">
                    전체 보기 <ArrowRight size={12} />
                  </NavLink>
                </div>
                <div className="space-y-2">
                  {plannedExpenses.length > 0 ? plannedExpenses.slice(0, 3).map((expense) => (
                    <div
                      key={expense.id}
                      onClick={() => navigateCrossLink(navigate, { target: '/expenses', filter: { id: expense.id } })}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-700 truncate">{expense.title}</p>
                        {expense.dueDate && (
                          <p className="text-xs text-stone-400">{expense.dueDate}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-amber-600 flex-shrink-0 ml-2">
                        {new Intl.NumberFormat('ko-KR', { notation: 'compact' }).format(expense.amount)}
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-stone-400 text-center py-4">결제 예정 항목이 없어요</p>
                  )}
                </div>
              </div>

              {/* 마감 임박 체크리스트 */}
              <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    마감 임박
                  </h3>
                  <NavLink to="/checklist" className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-0.5">
                    전체 보기 <ArrowRight size={12} />
                  </NavLink>
                </div>
                <div className="space-y-2">
                  {urgentChecklistItems.length > 0 ? urgentChecklistItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate('/checklist')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <span className="text-xs bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                        {item.due_period}
                      </span>
                      <p className="text-sm text-stone-700 truncate">{item.title}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-stone-400 text-center py-4">마감 임박 항목이 없어요</p>
                  )}
                </div>
              </div>
            </motion.section>

            {/* 예식장 확정 여부 & 파트너 활동 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-2 gap-6"
            >
              {/* 예식장 확정 여부 */}
              <div className={`rounded-2xl border p-5 shadow-sm ${venueConfirmed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-stone-200/60'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className={`w-4 h-4 ${venueConfirmed ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <h3 className="font-bold text-stone-800 text-base">예식장</h3>
                </div>
                {venueConfirmed ? (
                  <p className="text-sm text-emerald-700 font-medium">✅ 예식장이 확정되었어요</p>
                ) : (
                  <div>
                    <p className="text-sm text-stone-500 mb-2">아직 예식장이 확정되지 않았어요</p>
                    <button
                      onClick={() => navigate('/venues')}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                    >
                      예식장 관리 <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* 파트너 최근 활동 */}
              <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users className={`w-4 h-4 ${partnerConnected ? 'text-blue-500' : 'text-stone-400'}`} />
                  <h3 className="font-bold text-stone-800 text-base">파트너 활동</h3>
                </div>
                {partnerConnected ? (
                  <div>
                    <p className="text-sm text-stone-600">
                      {partnerActivityText || '최근 활동 없음'}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-600">연결됨</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-stone-500 mb-2">파트너와 연결되지 않았어요</p>
                    <button
                      onClick={() => navigate('/couple/connect')}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                    >
                      커플 연결 <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
