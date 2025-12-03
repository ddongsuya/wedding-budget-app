import React, { useEffect, useState } from 'react';
import { Card, SummaryCard } from '../components/ui/Card';
import { StorageService } from '../services/storage';
import { BudgetSettings, Venue, Expense, CoupleProfile } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Wallet, Store, CreditCard, TrendingUp, CalendarClock, AlertTriangle, ArrowRight, User, Heart } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { DashboardSkeleton } from '../src/components/skeleton/DashboardSkeleton';

const COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#8b5cf6', '#6366f1', '#64748b'];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<BudgetSettings | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profile, setProfile] = useState<CoupleProfile | null>(null);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setBudget(StorageService.getBudget());
      setVenues(StorageService.getVenues());
      setExpenses(StorageService.getExpenses());
      setProfile(StorageService.getCoupleProfile());
      setLoading(false);
    }, 800);
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!budget || !profile) return <div className="p-8">Loading...</div>;

  // --- Calculations ---

  const totalSpent = budget.categories.reduce((acc, cat) => acc + cat.spentAmount, 0);
  const remainingBudget = budget.totalBudget - totalSpent;
  const progress = (totalSpent / budget.totalBudget) * 100;

  // This Month Planned
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // "YYYY-MM"
  const thisMonthPlanned = expenses
    .filter(e => e.status === 'planned' && e.paymentDate.startsWith(currentMonth))
    .reduce((acc, e) => acc + e.amount, 0);

  // Over Budget Categories
  const overBudgetCategories = budget.categories.filter(c => c.spentAmount > c.budgetAmount && c.budgetAmount > 0);

  // Groom vs Bride Actual Spending
  const groomSpent = expenses.filter(e => e.paidBy === 'groom').reduce((acc, e) => acc + e.amount, 0);
  const brideSpent = expenses.filter(e => e.paidBy === 'bride').reduce((acc, e) => acc + e.amount, 0);
  const sharedSpent = expenses.filter(e => e.paidBy === 'shared').reduce((acc, e) => acc + e.amount, 0);
  
  // Recent Expenses (Top 5)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  // Chart Data: Category Distribution
  const categoryData = budget.categories.map(cat => ({
    name: cat.name,
    value: cat.spentAmount
  })).filter(d => d.value > 0);

  // Chart Data: Budget vs Actual
  const budgetVsActualData = budget.categories.map(cat => ({
    name: cat.name,
    budget: cat.budgetAmount,
    actual: cat.spentAmount
  }));

  // Chart Data: Contribution
  const contributionData = [
    { name: '신랑', value: groomSpent, fill: '#3b82f6' },
    { name: '신부', value: brideSpent, fill: '#f43f5e' },
    { name: '공동', value: sharedSpent, fill: '#a8a29e' },
  ];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
  };

  // Date Diff Calcs
  const calculateDays = (targetDate: string, isFuture: boolean = true) => {
    const start = new Date(today.toISOString().split('T')[0]).getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - start;
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return isFuture ? days : Math.abs(days) + 1; // +1 to include today
  };

  const dDay = calculateDays(profile.weddingDate);
  const dPlusDay = calculateDays(profile.meetingDate, false);

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      
      {/* Couple Header Section */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-sm p-6 md:p-8">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
               <div className="flex -space-x-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-md bg-stone-100 overflow-hidden">
                    {profile.groom.avatarUrl ? <img src={profile.groom.avatarUrl} alt="Groom" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-300"><User size={30}/></div>}
                  </div>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-md bg-stone-100 overflow-hidden z-10">
                    {profile.bride.avatarUrl ? <img src={profile.bride.avatarUrl} alt="Bride" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-300"><User size={30}/></div>}
                  </div>
               </div>
               <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                     {profile.nickname || '우리 결혼해요'}
                     <Heart className="text-rose-500 fill-rose-500 animate-pulse" size={24}/>
                  </h2>
                  <p className="text-stone-500 font-medium mt-1">
                     {profile.groom.name} & {profile.bride.name}
                  </p>
               </div>
            </div>

            <div className="flex gap-4 md:gap-8 text-center bg-stone-50/80 backdrop-blur-sm p-4 rounded-2xl">
               <div>
                  <p className="text-xs text-stone-500 font-bold uppercase tracking-wide">만난 지</p>
                  <p className="text-xl md:text-2xl font-bold text-rose-500">D+{dPlusDay}</p>
               </div>
               <div className="w-px bg-stone-200"></div>
               <div>
                  <p className="text-xs text-stone-500 font-bold uppercase tracking-wide">결혼까지</p>
                  <p className="text-xl md:text-2xl font-bold text-rose-500">D-{dDay}</p>
               </div>
            </div>
         </div>
         
         {/* Background Decoration */}
         {profile.couplePhotoUrl && (
            <div className="absolute inset-0 z-0 opacity-10">
               <img src={profile.couplePhotoUrl} alt="Back" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
            </div>
         )}
      </div>

      {/* Alerts for Over Budget */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-red-700">예산 초과 경고</h4>
            <p className="text-sm text-red-600 mt-1">
              {overBudgetCategories.map(c => c.name).join(', ')} 항목이 예산을 초과했습니다.
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
        />
        <SummaryCard 
          label="현재 총 지출" 
          value={formatMoney(totalSpent)} 
          icon={<CreditCard size={20} />} 
          trend="예산의 사용률"
        />
        <SummaryCard 
          label="이번 달 지출 예정" 
          value={formatMoney(thisMonthPlanned)} 
          icon={<CalendarClock size={20} />} 
          trend="결제 예정 금액"
        />
        <SummaryCard 
          label="관심 식장" 
          value={`${venues.length}곳`} 
          icon={<Store size={20} />} 
          trend={`${venues.filter(v => v.status === 'visited').length}곳 방문 완료`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget vs Actual Chart */}
        <div className="lg:col-span-2">
          <Card title="카테고리별 예산 대비 지출" className="h-full min-h-[350px]">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActualData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} tickFormatter={(val) => `${val/10000}만`} />
                  <Tooltip 
                    cursor={{fill: '#f5f5f4'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => formatMoney(value)}
                  />
                  <Legend iconType="circle" />
                  <Bar name="예산" dataKey="budget" fill="#e7e5e4" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar name="실지출" dataKey="actual" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Category Distribution */}
        <div className="lg:col-span-1">
          <Card title="지출 비중" className="h-full min-h-[350px]">
            <div className="h-[300px] w-full flex flex-col items-center justify-center relative">
               {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatMoney(value)} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
               ) : (
                 <div className="text-center text-stone-400">
                   <p className="mb-2">지출 내역이 없습니다</p>
                   <p className="text-xs">첫 지출을 기록해보세요</p>
                 </div>
               )}
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Row 2 & Recent List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Contribution Comparison */}
        <Card title="신랑/신부 지출 분담 현황" className="h-full">
           <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#57534e', fontSize: 14, fontWeight: 500}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => formatMoney(value)}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                    {contributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-6 mt-2 text-sm text-stone-500">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div> 신랑 부담
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-rose-500"></div> 신부 부담
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-stone-400"></div> 공동 부담
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
          <div className="space-y-4">
            {recentExpenses.length > 0 ? (
              recentExpenses.map(expense => (
                <div key={expense.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400">
                      {expense.paymentMethod === 'card' ? <CreditCard size={18}/> : <Wallet size={18}/>}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 text-sm">{expense.title}</p>
                      <p className="text-xs text-stone-500">{expense.paymentDate} · {expense.vendorName || '업체미정'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-stone-800 text-sm">{formatMoney(expense.amount)}</p>
                    <p className="text-[10px] text-stone-400">
                      {expense.paidBy === 'groom' ? '신랑' : expense.paidBy === 'bride' ? '신부' : '공동'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-stone-400">
                <p>최근 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
