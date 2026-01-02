import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Wallet, Receipt, Settings, Menu, Plus, User, Heart, Calendar, FileText, LogOut, Camera } from 'lucide-react';
import { NotificationBadge } from '@/components/common/NotificationBadge';
import { ExpenseForm } from './expense/ExpenseForm';
import { CoupleProfile, Expense, BudgetCategory } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { useCoupleProfile } from '@/hooks/useCoupleProfile';
import { useBudget } from '@/hooks/useBudget';
import { expenseAPI, ExpenseCreateInput } from '@/api/expenses';
import { invalidateQueries } from '@/lib/queryClient';

interface LayoutProps {
  children: ReactNode;
}

// 데스크톱용 전체 메뉴
const NAV_ITEMS = [
  { path: '/', label: '홈', icon: LayoutDashboard },
  { path: '/budget', label: '예산', icon: Wallet },
  { path: '/expenses', label: '지출', icon: Receipt },
  { path: '/checklist', label: '체크', icon: FileText },
  { path: '/schedule', label: '일정', icon: Calendar },
  { path: '/venues', label: '식장', icon: Store },
  { path: '/photo-references', label: '포토', icon: Camera },
  { path: '/settings', label: '설정', icon: Settings },
];

// 모바일용 주요 메뉴 (5개로 제한하여 터치 타겟 확보)
const MOBILE_NAV_ITEMS = [
  { path: '/', label: '홈', icon: LayoutDashboard },
  { path: '/budget', label: '예산', icon: Wallet },
  { path: '/schedule', label: '일정', icon: Calendar },
  { path: '/venues', label: '식장', icon: Store },
  { path: '/settings', label: '더보기', icon: Menu },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { profile: apiProfile } = useCoupleProfile();
  const { categories: apiCategories } = useBudget();
  
  // API 카테고리를 ExpenseForm에서 사용하는 형식으로 변환
  const budgetCategories: BudgetCategory[] = apiCategories.map(c => ({
    id: String(c.id),
    name: c.name,
    icon: c.icon || 'Circle',
    parentId: null,
    budgetAmount: c.budget_amount || 0,
    spentAmount: c.spent_amount || 0,
    color: c.color || '#f43f5e',
  }));
  
  // API 프로필을 Layout에서 사용하는 형식으로 변환
  const profile: CoupleProfile | null = apiProfile ? {
    groom: {
      name: apiProfile.groom_name || '신랑',
      avatarUrl: apiProfile.groom_image || null,
      birthday: apiProfile.groom_birth_date || '',
      contact: apiProfile.groom_contact || '',
    },
    bride: {
      name: apiProfile.bride_name || '신부',
      avatarUrl: apiProfile.bride_image || null,
      birthday: apiProfile.bride_birth_date || '',
      contact: apiProfile.bride_contact || '',
    },
    weddingDate: apiProfile.wedding_date || '',
    meetingDate: apiProfile.first_met_date || '',
    nickname: apiProfile.couple_nickname || '',
    couplePhotoUrl: apiProfile.couple_photo || null,
  } : null;
  
  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // FAB State
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // Scroll State for Header
  const [isScrolled, setIsScrolled] = useState(false);
  
  // User Menu
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('로그아웃되었습니다');
    navigate('/login');
  };

  useEffect(() => {
    setIsFabOpen(false); // Close FAB on route change
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSaveExpense = async (expense: Expense) => {
    try {
      // category_id 파싱 (빈 문자열이나 유효하지 않은 값 처리)
      const categoryId = expense.categoryId ? parseInt(expense.categoryId) : null;
      const validCategoryId = categoryId && !isNaN(categoryId) ? categoryId : undefined;
      
      // API를 통해 지출 저장
      const apiData: ExpenseCreateInput = {
        title: expense.title,
        amount: expense.amount,
        date: expense.paymentDate, // YYYY-MM-DD 형식
        payer: expense.paidBy === 'shared' ? 'groom' : expense.paidBy, // API는 shared를 지원하지 않으므로 groom으로 대체
        category_id: validCategoryId,
        payment_method: expense.paymentMethod,
        vendor: expense.vendorName || undefined,
        notes: expense.memo || undefined,
      };
      
      await expenseAPI.create(apiData);
      
      // React Query 캐시 무효화 (React Query를 사용하는 컴포넌트용)
      invalidateQueries.expenses();
      invalidateQueries.budget();
      invalidateQueries.stats();
      
      // 커스텀 이벤트 발생 (useState 기반 훅들이 데이터를 다시 가져오도록)
      window.dispatchEvent(new CustomEvent('expense-updated'));
      
      toast.success('지출이 저장되었습니다');
      setIsExpenseModalOpen(false);
    } catch (error) {
      console.error('지출 저장 실패:', error);
      toast.error('지출 저장에 실패했습니다');
    }
  };
  
  const calculateDDay = (targetDate: string) => {
    const today = new Date(new Date().toISOString().split('T')[0]).getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - today;
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const dDay = profile ? calculateDDay(profile.weddingDate) : 0;

  const handleFabAction = (e: React.MouseEvent | React.TouchEvent, action: string) => {
    e.stopPropagation();
    // e.preventDefault(); // Removed to allow scrolling if user drags, but for clicks we want to be explicit
    
    // Close FAB first
    setIsFabOpen(false);
    
    // Use a small timeout to allow the menu close animation to start and prevent event conflicts
    setTimeout(() => {
      switch (action) {
        case 'schedule':
          navigate('/schedule', { state: { openAdd: true } });
          break;
        case 'venue':
          navigate('/venues', { state: { openAdd: true } });
          break;
        case 'expense':
          setIsExpenseModalOpen(true);
          break;
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row text-stone-800 font-sans">
      
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        메인 콘텐츠로 건너뛰기
      </a>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 h-screen sticky top-0 z-50" role="navigation" aria-label="메인 네비게이션">
        <div className="p-6 flex flex-col items-center justify-center border-b border-stone-100 gap-3">
          <h1 className="text-xl font-bold text-stone-800 flex items-center gap-1">
             Wedding <span className="text-rose-500">Planner</span>
          </h1>
          {profile && (
             <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-full mt-1">
                <div className="flex -space-x-2">
                   <div className="w-6 h-6 rounded-full border border-white bg-stone-200 overflow-hidden">
                     {profile.groom.avatarUrl ? <img src={profile.groom.avatarUrl} alt={`${profile.groom.name} 프로필`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]" aria-label={profile.groom.name}><User size={12} aria-hidden="true" /></div>}
                   </div>
                   <div className="w-6 h-6 rounded-full border border-white bg-stone-200 overflow-hidden">
                     {profile.bride.avatarUrl ? <img src={profile.bride.avatarUrl} alt={`${profile.bride.name} 프로필`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]" aria-label={profile.bride.name}><User size={12} aria-hidden="true" /></div>}
                   </div>
                </div>
                <span className="text-xs font-medium text-stone-600 truncate max-w-[100px]">{profile.nickname || '우리'}</span>
             </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 shadow-sm'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                }`
              }
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              <item.icon size={20} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-100 space-y-3">
           {profile && (
             <div className="bg-rose-50 p-4 rounded-xl relative overflow-hidden group" role="region" aria-label="결혼식 D-Day">
                <div className="relative z-10">
                  <p className="text-xs text-rose-600 font-semibold mb-1 flex items-center gap-1">
                     <Heart size={10} className="fill-rose-600" aria-hidden="true" /> Wedding Day
                  </p>
                  <p className="text-sm font-bold text-stone-800">{formatDate(profile.weddingDate)}</p>
                  <p className="text-2xl font-bold text-rose-500 mt-1" aria-live="polite">
                    {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day!' : `D+${Math.abs(dDay)}`}
                  </p>
                </div>
                <Heart className="absolute -bottom-4 -right-4 text-rose-100 w-24 h-24 rotate-12 group-hover:scale-110 transition-transform" aria-hidden="true" />
             </div>
           )}
           
           {/* 사용자 정보 및 로그아웃 */}
           {user && (
             <div className="space-y-2">
               <div className="px-3 py-2 bg-stone-50 rounded-lg" role="region" aria-label="사용자 정보">
                 <p className="text-xs text-stone-500">로그인</p>
                 <p className="text-sm font-medium text-stone-800 truncate">{user.name}</p>
                 <p className="text-xs text-stone-400 truncate">{user.email}</p>
               </div>
               <button
                 onClick={handleLogout}
                 className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                 aria-label="로그아웃"
               >
                 <LogOut size={16} aria-hidden="true" />
                 로그아웃
               </button>
             </div>
           )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 mb-16 md:mb-0" role="main" id="main-content">
        
        {/* Mobile Header (Scroll Aware) */}
        <header 
          className={`md:hidden sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white border-b border-stone-100'}`}
          style={{ 
            paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
            paddingBottom: isScrolled ? '8px' : '16px'
          }}
          role="banner"
        >
           <div className="px-4 flex items-center justify-between">
              <h1 className={`font-bold text-rose-500 transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>Wedding Planner</h1>
              <div className="flex items-center gap-2">
                {profile && (
                    <div className={`flex -space-x-2 transition-transform duration-300 ${isScrolled ? 'scale-75 origin-right' : 'scale-100'}`} aria-label="커플 프로필">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 overflow-hidden">
                        {profile.groom.avatarUrl ? <img src={profile.groom.avatarUrl} alt={`${profile.groom.name} 프로필`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400" aria-label={profile.groom.name}><User size={16} aria-hidden="true" /></div>}
                      </div>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 overflow-hidden">
                        {profile.bride.avatarUrl ? <img src={profile.bride.avatarUrl} alt={`${profile.bride.name} 프로필`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400" aria-label={profile.bride.name}><User size={16} aria-hidden="true" /></div>}
                      </div>
                    </div>
                )}
                
                {/* 알림 배지 */}
                <NotificationBadge iconSize={20} />
                
                {/* 모바일 사용자 메뉴 */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-lg transition-colors touch-feedback"
                    aria-label="메뉴 열기"
                    aria-expanded={showUserMenu}
                    aria-haspopup="menu"
                  >
                    <Menu size={20} className="text-stone-600" aria-hidden="true" />
                  </button>
                  
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)}
                        aria-hidden="true"
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-50" role="menu" aria-label="사용자 메뉴">
                        {user && (
                          <>
                            <div className="px-4 py-2 border-b border-stone-100" role="menuitem">
                              <p className="text-sm font-medium text-stone-900">{user.name}</p>
                              <p className="text-xs text-stone-500 truncate">{user.email}</p>
                            </div>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              role="menuitem"
                              aria-label="로그아웃"
                            >
                              <LogOut size={16} aria-hidden="true" />
                              로그아웃
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
           {children}
        </div>
      </main>

      {/* Expandable FAB System */}
      <div 
        className="md:hidden fixed right-4 z-50 flex flex-col items-end gap-3 pointer-events-auto" 
        style={{ bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}
        role="group" 
        aria-label="빠른 추가 메뉴"
      >
         <AnimatePresence>
            {isFabOpen && (
               <>
                  <motion.button
                     initial={{ opacity: 0, y: 20, scale: 0.8 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.8 }}
                     transition={{ delay: 0.1 }}
                     onClick={(e) => handleFabAction(e, 'schedule')}
                     className="flex items-center gap-2 bg-white text-stone-600 px-4 py-3 min-h-[44px] rounded-full shadow-lg border border-stone-100 font-medium text-sm z-50 pointer-events-auto touch-feedback"
                     aria-label="일정 추가"
                  >
                     일정 추가 <Calendar size={18} className="text-blue-500" aria-hidden="true" />
                  </motion.button>
                  
                  <motion.button
                     initial={{ opacity: 0, y: 20, scale: 0.8 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.8 }}
                     transition={{ delay: 0.05 }}
                     onClick={(e) => handleFabAction(e, 'venue')}
                     className="flex items-center gap-2 bg-white text-stone-600 px-4 py-3 min-h-[44px] rounded-full shadow-lg border border-stone-100 font-medium text-sm z-50 pointer-events-auto touch-feedback"
                     aria-label="식장 추가"
                  >
                     식장 추가 <Store size={18} className="text-purple-500" aria-hidden="true" />
                  </motion.button>

                  <motion.button
                     initial={{ opacity: 0, y: 20, scale: 0.8 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.8 }}
                     onClick={(e) => handleFabAction(e, 'expense')}
                     className="flex items-center gap-2 bg-white text-stone-600 px-4 py-3 min-h-[44px] rounded-full shadow-lg border border-stone-100 font-medium text-sm z-50 pointer-events-auto touch-feedback"
                     aria-label="지출 추가"
                  >
                     지출 추가 <Receipt size={18} className="text-green-500" aria-hidden="true" />
                  </motion.button>
               </>
            )}
         </AnimatePresence>

         <motion.button 
           onClick={(e) => { e.stopPropagation(); setIsFabOpen(!isFabOpen); }}
           animate={{ rotate: isFabOpen ? 45 : 0 }}
           whileTap={{ scale: 0.9 }}
           className={`w-14 h-14 min-w-[56px] min-h-[56px] rounded-full shadow-lg shadow-rose-500/30 flex items-center justify-center transition-colors z-50 pointer-events-auto touch-feedback ${isFabOpen ? 'bg-stone-800 text-white' : 'bg-rose-500 text-white'}`}
           aria-label={isFabOpen ? '메뉴 닫기' : '빠른 추가 메뉴 열기'}
           aria-expanded={isFabOpen}
           aria-haspopup="menu"
         >
           <Plus size={28} aria-hidden="true" />
         </motion.button>
      </div>
      
      {/* Backdrop for FAB */}
      {isFabOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsFabOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Bottom Navigation - 5개 메뉴로 최적화 */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]" 
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        role="navigation" 
        aria-label="모바일 네비게이션"
      >
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] p-2 rounded-lg transition-all touch-feedback active:scale-95 ${
                isActive ? 'text-rose-500' : 'text-stone-400'
              }`
            }
            aria-current={location.pathname === item.path ? 'page' : undefined}
            aria-label={item.label}
          >
            <item.icon size={22} strokeWidth={item.path === location.pathname ? 2.5 : 2} aria-hidden="true" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Global Expense Modal for FAB */}
      {isExpenseModalOpen && (
        <ExpenseForm 
          categories={budgetCategories}
          onSubmit={handleSaveExpense}
          onCancel={() => setIsExpenseModalOpen(false)}
        />
      )}
    </div>
  );
};