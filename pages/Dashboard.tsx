import React, { useMemo, useCallback, useState } from 'react';
import { Card, SummaryCard } from '../components/ui/Card';
import { BudgetSettings, Venue, Expense } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Wallet, Store, CreditCard, CalendarClock, AlertTriangle, ArrowRight, User, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { DashboardSkeleton } from '../src/components/skeleton/DashboardSkeleton';
import { useCoupleProfile } from '../src/hooks/useCoupleProfile';
import { useBudget } from '../src/hooks/useBudget';
import { useExpenses } from '../src/hooks/useExpenses';
import { EmptyState } from '../src/components/common/EmptyState';

// Sticky Summary Bar 컴포넌트
const StickySummary: React.FC<{dDay: number, budgetProgress: number, totalSpent: number, totalBudget: number}> = 
  ({ dDay, budgetProgress, totalSpent, totalBudget }) => (
  <div className="sticky top-[60px] md:top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-2.5 -mx-4 md:-mx-8 mb-4">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      {/* D-day */}
      <div className="flex items-center gap-2">
        <Heart size={14} className="text-rose-500 fill-rose-500" />
        <span className="text-xl font-bold text-rose-500">
          {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day!' : `D+${Math.abs(dDay)}`}
        </span>
      </div>
      
      {/* 미니 진행 바 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-500 hidden sm:inline">예산</span>
          <div className="w-12 sm:w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-stone-600">{budgetProgress.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  </div>
);

const COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#8b5cf6', '#6366f1', '#64748b'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile: apiProfile, loading: profileLoading } = useCoupleProfile();
  const { settings: budgetSettings, categories, loading: budgetLoading } = useBudget();
  const { expenses: apiExpenses, loading: expensesLoading } = useExpenses();
  
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
  const budget: BudgetSettings | null = budgetSettings ? {
    totalBudget: budgetSettings.total_budget || 0,
    groomRatio: budgetSettings.groom_ratio || 50,
    brideRatio: budgetSettings.bride_ratio || 50,
    weddingDate: profile.weddingDate || '',
    categories: categories.map(c => ({
      id: String(c.id),
      name: c.name,
      icon: c.icon || 'Circle',
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
  const expenses: Expense[] = (apiExpenses as any[])?.map((e: { id: number; category_id?: number; title: string; amount: number; date: string; payer: string; payment_method?: string; vendor?: string; notes?: string; created_at?: string; updated_at?: string }) => ({
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

  const loading = profileLoading || budgetLoading || expensesLoading;
  
  // TODO: venues도 API로 변경 필요
  const venues: Venue[] = [];

  // 금액 포맷 함수 - useCallback으로 메모이제이션
  const formatMoney = useCallback((amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
  }, []);

  // 날짜 계산 함수 - useCallback으로 메모이제이션
  const calculateDays = useCallback((targetDate: string) => {
    if (!targetDate) return 0;
    const today = new Date();
    const start = new Date(today.toISOString().split('T')[0]).getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - start;
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  }, []);

  // --- Memoized Calculations ---
  const { totalSpent, progress, overBudgetCategories } = useMemo(() => {
    const total = budget.categories.reduce((acc, cat) => acc + cat.spentAmount, 0);
    const remaining = budget.totalBudget - total;
    const prog = budget.totalBudget > 0 ? (total / budget.totalBudget) * 100 : 0;
    const overBudget = budget.categories.filter(c => c.spentAmount > c.budgetAmount && c.budgetAmount > 0);
    return { totalSpent: total, progress: prog, overBudgetCategories: overBudget };
  }, [budget.categories, budget.totalBudget]);

  // This Month Planned - useMemo
  const thisMonthPlanned = useMemo(() => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    return expenses
      .filter(e => e.status === 'planned' && e.paymentDate.startsWith(currentMonth))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  // Spending by payer - useMemo
  const { groomSpent, brideSpent, sharedSpent } = useMemo(() => ({
    groomSpent: expenses.filter(e => e.paidBy === 'groom').reduce((acc, e) => acc + e.amount, 0),
    brideSpent: expenses.filter(e => e.paidBy === 'bride').reduce((acc, e) => acc + e.amount, 0),
    sharedSpent: expenses.filter(e => e.paidBy === 'shared').reduce((acc, e) => acc + e.amount, 0),
  }), [expenses]);
  
  // Recent Expenses - useMemo
  const recentExpenses = useMemo(() => 
    [...expenses]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 5),
    [expenses]
  );

  // Chart Data - useMemo
  const categoryData = useMemo(() => 
    budget.categories.map(cat => ({
      name: cat.name,
      value: cat.spentAmount
    })).filter(d => d.value > 0),
    [budget.categories]
  );

  const budgetVsActualData = useMemo(() => 
    budget.categories.map(cat => ({
      name: cat.name,
      budget: cat.budgetAmount,
      actual: cat.spentAmount
    })),
    [budget.categories]
  );

  const contributionData = useMemo(() => [
    { name: '신랑', value: groomSpent, fill: '#3b82f6' },
    { name: '신부', value: brideSpent, fill: '#f43f5e' },
    { name: '공동', value: sharedSpent, fill: '#a8a29e' },
  ], [groomSpent, brideSpent, sharedSpent]);

  // D-day calculations - useMemo
  const { dDay, dPlusDay } = useMemo(() => ({
    dDay: calculateDays(profile.weddingDate),
    dPlusDay: profile.meetingDate ? Math.abs(calculateDays(profile.meetingDate)) + 1 : 0,
  }), [profile.weddingDate, profile.meetingDate, calculateDays]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 animate-fade-in pb-20 md:pb-0">
      
      {/* Couple Header Section - 개선된 디자인 */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white via-white to-rose-50/30 border border-stone-100/80 shadow-card p-4 sm:p-5">
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
               {/* 프로필 이미지 */}
               <div className="flex -space-x-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-soft-md bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden ring-2 ring-blue-100">
                    {profile.groom.avatarUrl ? <img src={profile.groom.avatarUrl} alt={`${profile.groom.name} 프로필 사진`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-blue-400" role="img" aria-label={`${profile.groom.name} 프로필`}><User size={22} aria-hidden="true" /></div>}
                  </div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-soft-md bg-gradient-to-br from-rose-50 to-rose-100 overflow-hidden z-10 ring-2 ring-rose-100">
                    {profile.bride.avatarUrl ? <img src={profile.bride.avatarUrl} alt={`${profile.bride.name} 프로필 사진`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-rose-400" role="img" aria-label={`${profile.bride.name} 프로필`}><User size={22} aria-hidden="true" /></div>}
                  </div>
               </div>
               {/* 커플 정보 */}
               <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-stone-800 flex items-center gap-1.5 truncate">
                     <span className="truncate">{profile.nickname || '우리 결혼해요'}</span>
                     <Heart className="text-rose-500 fill-rose-500 flex-shrink-0" size={14}/>
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm truncate">
                     {profile.groom.name} & {profile.bride.name}
                  </p>
               </div>
            </div>

            {/* D-day 카드 */}
            <div className="flex gap-3 text-center w-full md:w-auto justify-center">
               <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 px-4 py-2.5 rounded-xl border border-rose-100">
                  <p className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider">만난 지</p>
                  <p className="text-lg font-bold text-rose-600">D+{dPlusDay}</p>
               </div>
               <div className="bg-gradient-to-br from-rose-500 to-rose-600 px-4 py-2.5 rounded-xl shadow-button">
                  <p className="text-[10px] text-rose-100 font-semibold uppercase tracking-wider">결혼까지</p>
                  <p className="text-lg font-bold text-white">
                    {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day!' : `D+${Math.abs(dDay)}`}
                  </p>
               </div>
            </div>
         </div>
         
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100/30 to-transparent rounded-full -mr-10 -mt-10" aria-hidden="true" />
         {profile.couplePhotoUrl && (
            <div className="absolute inset-0 z-0 opacity-5" aria-hidden="true">
               <img src={profile.couplePhotoUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
         )}
      </div>

      {/* Alerts for Over Budget - 개선된 디자인 */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="text-red-500" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-red-700 text-sm">예산 초과</h4>
            <p className="text-xs text-red-600 truncate">
              {overBudgetCategories.map(c => c.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          label="총 예산" 
          value={formatMoney(budget.totalBudget)} 
          icon={<Wallet size={20} />} 
          trend={`${progress.toFixed(1)}% 배정됨`}
          delay={0}
        />
        <SummaryCard 
          label="현재 총 지출" 
          value={formatMoney(totalSpent)} 
          icon={<CreditCard size={20} />} 
          trend="예산의 사용률"
          delay={50}
        />
        <SummaryCard 
          label="이번 달 지출 예정" 
          value={formatMoney(thisMonthPlanned)} 
          icon={<CalendarClock size={20} />} 
          trend="결제 예정 금액"
          delay={100}
        />
        <SummaryCard 
          label="관심 식장" 
          value={`${venues.length}곳`} 
          icon={<Store size={20} />} 
          trend={`${venues.filter(v => v.status === 'visited').length}곳 방문 완료`}
          delay={150}
        />
      </div>

      {/* Charts Row 1 - 컴팩트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget vs Actual Chart */}
        <div className="lg:col-span-2">
          <Card title="카테고리별 예산 대비 지출" className="h-full">
            <div className="h-[220px] md:h-[260px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActualData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 11}} tickFormatter={(val) => `${val/10000}만`} />
                  <Tooltip 
                    cursor={{fill: '#f5f5f4'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => formatMoney(value)}
                  />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                  <Bar name="예산" dataKey="budget" fill="#e7e5e4" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar name="실지출" dataKey="actual" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Category Distribution */}
        <div className="lg:col-span-1">
          <Card title="지출 비중" className="h-full">
            <div className="h-[220px] md:h-[260px] w-full flex flex-col items-center justify-center relative">
               {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatMoney(value)} />
                    <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
               ) : (
                 <EmptyState
                   illustration="expense"
                   title="지출 내역이 없어요"
                   description="첫 지출을 기록해보세요"
                   actionLabel="지출 기록하기"
                   onAction={() => navigate('/expenses')}
                   className="py-2"
                 />
               )}
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Row 2 & Recent List - 컴팩트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Contribution Comparison */}
        <Card title="신랑/신부 지출 분담" className="h-full">
           <div className="h-[180px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#57534e', fontSize: 13, fontWeight: 500}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => formatMoney(value)}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {contributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-4 mt-1 text-xs text-stone-500">
              <div className="flex items-center gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> 신랑
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> 신부
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-stone-400"></div> 공동
              </div>
           </div>
        </Card>

        {/* Recent Activity */}
        <Card 
          title="최근 지출 내역" 
          action={
            <NavLink to="/expenses" className="text-xs text-rose-500 font-medium hover:text-rose-600 flex items-center gap-1">
              전체보기 <ArrowRight size={12} />
            </NavLink>
          }
        >
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense, index) => (
                <div 
                  key={expense.id} 
                  className="flex justify-between items-center p-2.5 bg-stone-50 rounded-lg hover:bg-stone-100 transition-all duration-200 stagger-item touch-feedback active:scale-[0.98]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400">
                      {expense.paymentMethod === 'card' ? <CreditCard size={14}/> : <Wallet size={14}/>}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 text-xs">{expense.title}</p>
                      <p className="text-[10px] text-stone-500">{expense.paymentDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-stone-800 text-xs">{formatMoney(expense.amount)}</p>
                    <p className="text-[9px] text-stone-400">
                      {expense.paidBy === 'groom' ? '신랑' : expense.paidBy === 'bride' ? '신부' : '공동'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                illustration="expense"
                title="최근 지출 내역이 없어요"
                description="결혼 준비 비용을 기록해보세요"
                actionLabel="지출 기록하기"
                onAction={() => navigate('/expenses')}
                className="py-2"
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
