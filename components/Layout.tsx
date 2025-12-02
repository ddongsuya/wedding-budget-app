import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Wallet, Receipt, Settings, Menu, Plus, User, Heart, X, Calendar, FileText, LogOut } from 'lucide-react';
import { ExpenseForm } from './expense/ExpenseForm';
import { VenueForm } from './venue/VenueForm'; // Assuming VenueForm is needed for Venue quick add
import { StorageService } from '../services/storage';
import { CoupleProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../src/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/', label: '홈', icon: LayoutDashboard },
  { path: '/budget', label: '예산', icon: Wallet },
  { path: '/venues', label: '식장', icon: Store },
  { path: '/expenses', label: '지출', icon: Receipt },
  { path: '/settings', label: '설정', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  
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
    navigate('/login');
  };

  useEffect(() => {
    setProfile(StorageService.getCoupleProfile());
    setIsFabOpen(false); // Close FAB on route change
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSaveExpense = (expense: any) => {
    StorageService.addExpense(expense);
    setIsExpenseModalOpen(false);
    if (location.pathname === '/expenses' || location.pathname === '/') {
      window.location.reload(); 
    }
  };
  
  const calculateDDay = (targetDate: string) => {
    const today = new Date(new Date().toISOString().split('T')[0]).getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - today;
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
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
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 h-screen sticky top-0 z-50">
        <div className="p-6 flex flex-col items-center justify-center border-b border-stone-100 gap-3">
          <h1 className="text-xl font-bold text-stone-800 flex items-center gap-1">
             Wedding <span className="text-rose-500">Planner</span>
          </h1>
          {profile && (
             <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-full mt-1">
                <div className="flex -space-x-2">
                   <div className="w-6 h-6 rounded-full border border-white bg-stone-200 overflow-hidden">
                     {profile.groom.avatarUrl ? <img src={profile.groom.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]"><User size={12}/></div>}
                   </div>
                   <div className="w-6 h-6 rounded-full border border-white bg-stone-200 overflow-hidden">
                     {profile.bride.avatarUrl ? <img src={profile.bride.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]"><User size={12}/></div>}
                   </div>
                </div>
                <span className="text-xs font-medium text-stone-600 truncate max-w-[100px]">{profile.nickname || '우리'}</span>
             </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
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
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-100 space-y-3">
           {profile && (
             <div className="bg-rose-50 p-4 rounded-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-xs text-rose-600 font-semibold mb-1 flex items-center gap-1">
                     <Heart size={10} className="fill-rose-600"/> Wedding Day
                  </p>
                  <p className="text-sm font-bold text-stone-800">{profile.weddingDate}</p>
                  <p className="text-2xl font-bold text-rose-500 mt-1">D-{dDay}</p>
                </div>
                <Heart className="absolute -bottom-4 -right-4 text-rose-100 w-24 h-24 rotate-12 group-hover:scale-110 transition-transform"/>
             </div>
           )}
           
           {/* 사용자 정보 및 로그아웃 */}
           {user && (
             <div className="space-y-2">
               <div className="px-3 py-2 bg-stone-50 rounded-lg">
                 <p className="text-xs text-stone-500">로그인</p>
                 <p className="text-sm font-medium text-stone-800 truncate">{user.name}</p>
                 <p className="text-xs text-stone-400 truncate">{user.email}</p>
               </div>
               <button
                 onClick={handleLogout}
                 className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
               >
                 <LogOut size={16} />
                 로그아웃
               </button>
             </div>
           )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 mb-16 md:mb-0">
        
        {/* Mobile Header (Scroll Aware) */}
        <div className={`md:hidden sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-2' : 'bg-white border-b border-stone-100 py-4'}`}>
           <div className="px-4 flex items-center justify-between">
              <h1 className={`font-bold text-rose-500 transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>Wedding Planner</h1>
              <div className="flex items-center gap-2">
                {profile && (
                    <div className={`flex -space-x-2 transition-transform duration-300 ${isScrolled ? 'scale-75 origin-right' : 'scale-100'}`}>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 overflow-hidden">
                        {profile.groom.avatarUrl ? <img src={profile.groom.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400"><User size={16}/></div>}
                      </div>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 overflow-hidden">
                        {profile.bride.avatarUrl ? <img src={profile.bride.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400"><User size={16}/></div>}
                      </div>
                    </div>
                )}
                
                {/* 모바일 사용자 메뉴 */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <Menu size={20} className="text-stone-600" />
                  </button>
                  
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-50">
                        {user && (
                          <>
                            <div className="px-4 py-2 border-b border-stone-100">
                              <p className="text-sm font-medium text-stone-900">{user.name}</p>
                              <p className="text-xs text-stone-500 truncate">{user.email}</p>
                            </div>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut size={16} />
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
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
           {children}
        </div>
      </main>

      {/* Expandable FAB System */}
      <div className="md:hidden fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 pointer-events-auto">
         <AnimatePresence>
            {isFabOpen && (
               <>
                  <motion.button
                     initial={{ opacity: 0, y: 20, scale: 0.8 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.8 }}
                     transition={{ delay: 0.1 }}
                     onClick={(e) => handleFabAction(e, 'schedule')}
                     className="flex items-center gap-2 bg-white text-stone-600 px-4 py-2 rounded-full shadow-lg border border-stone-100 font-medium text-sm z-50 pointer-events-auto"
                  >
                     일정 추가 <Calendar size={18} className="text-blue-500"/>
                  </motion.button>
                  
                  <motion.button
                     initial={{ opacity: 0, y: 20, scale: 0.8 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.8 }}
                     transition={{ delay: 0.05 }}
                     onClick={(e) => handleFabAction(e, 'venue')}
                     className="flex items-center gap-2 bg-white text-stone-600 px-4 py-2 rounded-full shadow-lg border border-stone-100 font-medium text-sm z-50 pointer-events-auto"
                  >
                     식장 추가 <Store size={18} className="text-purple-500"/>
                  </motion.button>

                  <motion.button
                     initial={{ opacity: 0, y: 20, scale: 0.8 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.8 }}
                     onClick={(e) => handleFabAction(e, 'expense')}
                     className="flex items-center gap-2 bg-white text-stone-600 px-4 py-2 rounded-full shadow-lg border border-stone-100 font-medium text-sm z-50 pointer-events-auto"
                  >
                     지출 추가 <Receipt size={18} className="text-green-500"/>
                  </motion.button>
               </>
            )}
         </AnimatePresence>

         <motion.button 
           onClick={(e) => { e.stopPropagation(); setIsFabOpen(!isFabOpen); }}
           animate={{ rotate: isFabOpen ? 45 : 0 }}
           whileTap={{ scale: 0.9 }}
           className={`w-14 h-14 rounded-full shadow-lg shadow-rose-500/30 flex items-center justify-center transition-colors z-50 pointer-events-auto ${isFabOpen ? 'bg-stone-800 text-white' : 'bg-rose-500 text-white'}`}
         >
           <Plus size={28} />
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
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-2 flex justify-between items-center z-50 safe-area-pb shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px] active:scale-95 ${
                isActive ? 'text-rose-500' : 'text-stone-400'
              }`
            }
          >
            <item.icon size={24} strokeWidth={item.path === location.pathname ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Global Expense Modal for FAB */}
      {isExpenseModalOpen && (
        <ExpenseForm 
          categories={StorageService.getBudget().categories}
          onSubmit={handleSaveExpense}
          onCancel={() => setIsExpenseModalOpen(false)}
        />
      )}
    </div>
  );
};