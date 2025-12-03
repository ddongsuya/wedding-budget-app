import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Expense, BudgetCategory } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { ExpenseForm } from '../components/expense/ExpenseForm';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Plus, Search, Filter, Edit2, Trash2, CheckCircle2, CircleDashed, CreditCard, Banknote, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../src/hooks/useToast';
import { ExpensesSkeleton } from '../src/components/skeleton/ExpensesSkeleton';
import { EmptyState, NoSearchResults } from '../src/components/common/EmptyState';

export const Expenses: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Simulate network delay for skeleton demo
    setTimeout(() => {
      setExpenses(StorageService.getExpenses());
      setCategories(StorageService.getBudget().categories);
      setLoading(false);
    }, 500);
  };

  const handleSave = (expense: Expense) => {
    try {
      if (editingExpense) {
        StorageService.updateExpense(expense);
        toast.success('지출 내역이 수정되었습니다');
      } else {
        StorageService.addExpense(expense);
        toast.success('지출 내역이 추가되었습니다');
      }
      setExpenses(StorageService.getExpenses());
      setIsFormOpen(false);
      setEditingExpense(null);
    } catch (error) {
      toast.error('저장에 실패했습니다. 다시 시도해주세요');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        StorageService.deleteExpense(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
        toast.success('지출 내역이 삭제되었습니다');
      } catch (error) {
        toast.error('삭제에 실패했습니다');
      }
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '기타';
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#9ca3af';

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard size={14} />;
      case 'cash': return <Banknote size={14} />;
      case 'transfer': return <Landmark size={14} />;
      default: return <CreditCard size={14} />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'card': return '카드';
      case 'cash': return '현금';
      case 'transfer': return '이체';
      default: return method;
    }
  };

  const filteredExpenses = expenses
    .filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || e.categoryId === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col gap-4 sticky top-[60px] md:top-0 bg-stone-50 z-20 pb-2 md:pb-0 md:static">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">지출 내역</h2>
            <p className="text-stone-500 text-sm">지출 상세 내역을 기록하고 관리하세요.</p>
          </div>
          <Button icon={<Plus size={18} />} onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}>
            지출 추가
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="내역 검색 (항목명, 업체명)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 outline-none"
            />
          </div>
          
          <button 
            className="md:hidden p-2 bg-stone-50 rounded-lg text-stone-600 hover:bg-stone-100"
            onClick={() => setIsFilterSheetOpen(true)}
          >
            <Filter size={20} />
          </button>

          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="hidden md:block px-3 py-2 bg-stone-50 rounded-lg text-sm border-none outline-none text-stone-600 min-w-[140px]"
          >
            <option value="all">모든 카테고리</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <ExpensesSkeleton />
      ) : expenses.length === 0 ? (
        <EmptyState
          illustration="expense"
          title="아직 기록된 지출이 없어요"
          description="결혼 준비 비용을 기록하고 예산을 관리해보세요"
          actionLabel="첫 지출 기록하기"
          onAction={() => { setEditingExpense(null); setIsFormOpen(true); }}
        />
      ) : filteredExpenses.length === 0 ? (
        <NoSearchResults
          searchTerm={searchTerm}
          onClear={() => setSearchTerm('')}
        />
      ) : (
        <>
          {/* Mobile Swipeable List */}
          <div className="md:hidden space-y-4">
            {filteredExpenses.map(expense => (
              <SwipeableRow 
                key={expense.id} 
                onEdit={() => handleEdit(expense)} 
                onDelete={() => handleDelete(expense.id)}
              >
                <div className="p-4 rounded-2xl border border-stone-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-10 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(expense.categoryId) }}
                      ></div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-lg leading-tight">{expense.title}</h4>
                        <p className="text-xs text-stone-500 mt-1">{expense.paymentDate} · {getCategoryName(expense.categoryId)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                      expense.status === 'completed' ? 'bg-stone-100 text-stone-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {expense.status === 'completed' ? '완료' : '예정'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end border-t border-stone-50 pt-3">
                     <div className="text-xs text-stone-500 space-y-1">
                       <p className="flex items-center gap-1.5">
                         {getPaymentMethodIcon(expense.paymentMethod)} {getPaymentMethodLabel(expense.paymentMethod)} 
                         <span className="text-stone-300">|</span> 
                         {expense.paidBy !== 'shared' ? (expense.paidBy === 'groom' ? '신랑부담' : '신부부담') : '공동부담'}
                       </p>
                       {expense.vendorName && <p className="text-stone-400">@{expense.vendorName}</p>}
                     </div>
                     <div className="text-right">
                       <p className="text-xl font-bold text-stone-800 tracking-tight">{formatMoney(expense.amount)}</p>
                     </div>
                  </div>
                  
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 text-stone-300 pointer-events-none">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </div>
                </div>
              </SwipeableRow>
            ))}
            <p className="text-center text-xs text-stone-400 pt-4">좌측으로 밀어서 수정/삭제</p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-stone-50 text-stone-600 font-medium border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4">날짜</th>
                  <th className="px-6 py-4">내역</th>
                  <th className="px-6 py-4">카테고리</th>
                  <th className="px-6 py-4 text-right">금액</th>
                  <th className="px-6 py-4 text-center">결제수단</th>
                  <th className="px-6 py-4 text-center">분담</th>
                  <th className="px-6 py-4 text-center">상태</th>
                  <th className="px-6 py-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-6 py-4 text-stone-500 font-mono text-xs">{expense.paymentDate}</td>
                    <td className="px-6 py-4 font-medium text-stone-800">
                      {expense.title}
                      {expense.vendorName && <span className="text-xs text-stone-400 block font-normal">@{expense.vendorName}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-50 text-stone-600 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(expense.categoryId) }}></div>
                        {getCategoryName(expense.categoryId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-stone-800">{formatMoney(expense.amount)}</td>
                    <td className="px-6 py-4 text-center text-stone-500 text-xs">
                      <div className="flex items-center justify-center gap-1">
                        {getPaymentMethodIcon(expense.paymentMethod)} {getPaymentMethodLabel(expense.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs">
                       {expense.paidBy === 'shared' ? <span className="text-stone-400">공동</span> : 
                        expense.paidBy === 'groom' ? <span className="text-blue-500">신랑</span> : <span className="text-rose-500">신부</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {expense.status === 'completed' 
                        ? <span className="inline-flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/>완료</span> 
                        : <span className="inline-flex items-center gap-1 text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded-full"><CircleDashed size={12}/>예정</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(expense)} className="text-stone-400 hover:text-stone-700 p-1"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(expense.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="지출 필터"
        action={<Button className="w-full" onClick={() => setIsFilterSheetOpen(false)}>확인</Button>}
      >
        <div className="space-y-4">
          <label className="text-sm font-bold text-stone-800">카테고리 선택</label>
          <div className="grid grid-cols-2 gap-2">
            <motion.button
               whileTap={{ scale: 0.98 }}
               onClick={() => setFilterCategory('all')}
               className={`p-3 rounded-xl border text-sm font-medium transition-colors ${filterCategory === 'all' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600'}`}
            >
              전체
            </motion.button>
            {categories.map(c => (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilterCategory(c.id)}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${filterCategory === c.id ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600'}`}
              >
                {c.name}
              </motion.button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {isFormOpen && (
        <ExpenseForm 
          initialData={editingExpense} 
          categories={categories}
          onSubmit={handleSave} 
          onCancel={() => { setIsFormOpen(false); setEditingExpense(null); }} 
        />
      )}
    </div>
  );
};