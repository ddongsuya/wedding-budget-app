import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, Clock, MapPin, ChevronRight, Calendar } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: 'groom' | 'bride' | 'shared';
  category?: string;
  paymentMethod?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
}

interface RecentActivityGridProps {
  expenses: Expense[];
  events: Event[];
}

const formatMoney = (n: number) => 
  new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 0 }).format(n);

const getMonth = (dateStr: string) => {
  const date = new Date(dateStr);
  return (date.getMonth() + 1) + '월';
};

const getDay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.getDate();
};

const getDaysUntil = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const RecentActivityGrid: React.FC<RecentActivityGridProps> = ({ expenses, events }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* 최근 지출 */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="font-bold text-stone-800 text-sm md:text-base">최근 지출</h3>
          <NavLink to="/budget" className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-0.5">
            전체 보기 <ChevronRight size={14} />
          </NavLink>
        </div>

        <div className="space-y-2 md:space-y-3">
          {expenses.length > 0 ? expenses.slice(0, 5).map((expense, i) => (
            <motion.div 
              key={expense.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
              onClick={() => navigate('/budget')}
            >
              <div className={`
                w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center
                ${expense.paidBy === 'groom' ? 'bg-blue-100 text-blue-600' : 
                  expense.paidBy === 'bride' ? 'bg-rose-100 text-rose-600' : 
                  'bg-stone-100 text-stone-600'}
              `}>
                {expense.paymentMethod === 'card' ? <CreditCard size={16} /> : <Wallet size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-800 text-xs md:text-sm truncate">{expense.title}</p>
                <p className="text-[10px] md:text-xs text-stone-400">{expense.date}</p>
              </div>
              <span className="font-mono font-semibold text-stone-800 text-xs md:text-sm flex-shrink-0">
                {formatMoney(expense.amount)}
              </span>
            </motion.div>
          )) : (
            <div className="py-6 md:py-8 text-center">
              <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-stone-400">최근 지출 내역이 없어요</p>
            </div>
          )}
        </div>
      </div>

      {/* 다가오는 일정 */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="font-bold text-stone-800 text-sm md:text-base">다가오는 일정</h3>
          <NavLink to="/schedule" className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-0.5">
            전체 보기 <ChevronRight size={14} />
          </NavLink>
        </div>

        <div className="space-y-2 md:space-y-3">
          {events.length > 0 ? events.slice(0, 5).map((event, i) => {
            const daysUntil = getDaysUntil(event.date);
            return (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
                onClick={() => navigate('/schedule')}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] md:text-xs text-rose-400 font-medium leading-none">
                    {getMonth(event.date)}
                  </span>
                  <span className="text-base md:text-lg font-bold text-rose-600 leading-none">
                    {getDay(event.date)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-xs md:text-sm truncate">{event.title}</p>
                  <p className="text-[10px] md:text-xs text-stone-400 flex items-center gap-1 truncate">
                    {event.time && (
                      <>
                        <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                        <span>{event.time}</span>
                      </>
                    )}
                    {event.location && (
                      <>
                        <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 ml-1 md:ml-2 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className={`
                  w-2 h-2 rounded-full flex-shrink-0
                  ${daysUntil <= 3 ? 'bg-red-500' : 
                    daysUntil <= 7 ? 'bg-amber-500' : 'bg-emerald-500'}
                `} />
              </motion.div>
            );
          }) : (
            <div className="py-6 md:py-8 text-center">
              <Calendar className="w-8 h-8 md:w-10 md:h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-stone-400">예정된 일정이 없어요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivityGrid;
