import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { BudgetSettings, BudgetCategory } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BudgetSettingModal } from '../components/budget/BudgetSettingModal';
import { CategoryModal } from '../components/budget/CategoryModal';
import { Plus, ChevronRight, AlertCircle, Settings, Wallet, Heart } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '../src/hooks/useToast';
import { Skeleton } from '../src/components/common/Skeleton/Skeleton';
import { EmptyState } from '../src/components/common/EmptyState';

export const Budget: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<BudgetSettings | null>(null);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setBudget(StorageService.getBudget());
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton variant="text" width={150} height={28} className="mb-2" />
            <Skeleton variant="text" width={250} height={16} />
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rounded" width={80} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <Skeleton variant="rounded" width="100%" height={150} />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rounded" width="100%" height={80} />
          ))}
        </div>
      </div>
    );
  }

  if (!budget) return <div>Loading...</div>;

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const calculateTotalAllocated = () => budget.categories.reduce((acc, c) => acc + c.budgetAmount, 0);
  const totalAllocated = calculateTotalAllocated();
  const unallocated = budget.totalBudget - totalAllocated;
  const totalSpent = budget.categories.reduce((acc, c) => acc + c.spentAmount, 0);

  // Ratio Calculations
  const groomAmount = budget.totalBudget * (budget.groomRatio / 100);
  const brideAmount = budget.totalBudget * (budget.brideRatio / 100);

  const handleUpdateSettings = (newSettings: Partial<BudgetSettings>) => {
    try {
      const updated = StorageService.updateBudgetSettings(newSettings);
      setBudget(updated);
      toast.success('예산 설정이 저장되었습니다');
    } catch (error) {
      toast.error('설정 저장에 실패했습니다');
    }
  };

  const handleSaveCategory = (category: BudgetCategory) => {
    try {
      let updated;
      if (editingCategory) {
        updated = StorageService.updateCategory(category);
        toast.success('카테고리가 수정되었습니다');
      } else {
        updated = StorageService.addCategory(category);
        toast.success('카테고리가 추가되었습니다');
      }
      setBudget(updated);
      setEditingCategory(null);
    } catch (error) {
      toast.error('저장에 실패했습니다');
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('이 카테고리를 삭제하시겠습니까? 관련 지출 내역은 유지되지만 예산 정보는 사라집니다.')) {
      try {
        const updated = StorageService.deleteCategory(id);
        setBudget(updated);
        toast.success('카테고리가 삭제되었습니다');
      } catch (error) {
        toast.error('삭제에 실패했습니다');
      }
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Circle;
    return <IconComponent size={20} />;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">예산 관리</h2>
          <p className="text-stone-500 text-sm">항목별 예산을 계획하고 관리하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Settings size={16} />} onClick={() => setIsSettingModalOpen(true)}>
            설정
          </Button>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}>
            카테고리
          </Button>
        </div>
      </div>

      {/* Main Budget Status */}
      <Card className="bg-stone-800 text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-stone-400 text-sm mb-1 flex items-center gap-2"><Wallet size={14}/> 총 결혼 예산</p>
            <p className="text-3xl font-bold">{formatMoney(budget.totalBudget)}</p>
          </div>
          <div>
             <p className="text-stone-400 text-sm mb-1">배정된 예산</p>
             <p className="text-2xl font-semibold text-rose-300">{formatMoney(totalAllocated)}</p>
          </div>
          <div>
             <p className="text-stone-400 text-sm mb-1">총 지출액</p>
             <p className="text-2xl font-semibold text-stone-100">{formatMoney(totalSpent)}</p>
          </div>
        </div>
        
        {/* Allocation Alert */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${unallocated < 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
             <span className="text-sm text-stone-300">
               {unallocated < 0 
                 ? `예산이 ${formatMoney(Math.abs(unallocated))} 초과되었습니다`
                 : `아직 ${formatMoney(unallocated)} 배정 가능합니다`
               }
             </span>
           </div>
           
           {/* Groom/Bride Ratio Bar */}
           <div className="w-full md:w-1/2">
             <div className="flex justify-between text-xs text-stone-400 mb-1.5">
               <span className="flex items-center gap-1"><Heart size={10} className="text-blue-400 fill-blue-400"/> 신랑측 {budget.groomRatio}%</span>
               <span className="flex items-center gap-1"><Heart size={10} className="text-rose-400 fill-rose-400"/> 신부측 {budget.brideRatio}%</span>
             </div>
             <div className="h-2 w-full bg-stone-700 rounded-full overflow-hidden flex">
               <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${budget.groomRatio}%` }}></div>
               <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${budget.brideRatio}%` }}></div>
             </div>
             <div className="flex justify-between text-[10px] text-stone-500 mt-1">
               <span>{formatMoney(groomAmount)}</span>
               <span>{formatMoney(brideAmount)}</span>
             </div>
           </div>
        </div>
      </Card>

      {/* Categories List */}
      {budget.categories.length === 0 ? (
        <EmptyState
          illustration="budget"
          title="예산 카테고리를 추가해주세요"
          description="식장, 스드메, 예복 등 항목별로 예산을 배분해보세요"
          actionLabel="카테고리 추가하기"
          onAction={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {budget.categories.map((category) => (
          <div 
            key={category.id} 
            className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
            onClick={() => { setEditingCategory(category); setIsCategoryModalOpen(true); }}
          >
            {/* Progress Background */}
            <div 
              className="absolute left-0 bottom-0 h-1 bg-current transition-all duration-500" 
              style={{ width: `${Math.min((category.spentAmount / category.budgetAmount) * 100, 100)}%`, color: category.color }} 
            />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: category.color }}
                >
                  {getIcon(category.icon)}
                </div>
                <div>
                  <h4 className="font-bold text-stone-800">{category.name}</h4>
                  <p className="text-xs text-stone-500">
                    {category.budgetAmount > 0 
                      ? `${Math.round((category.spentAmount / category.budgetAmount) * 100)}% 사용됨`
                      : '예산 미설정'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-800">{formatMoney(category.spentAmount)}</p>
                  <p className="text-xs text-stone-400">/ {formatMoney(category.budgetAmount)}</p>
                </div>
                <div className="p-2 rounded-full hover:bg-stone-50 text-stone-300 group-hover:text-stone-500 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {isSettingModalOpen && (
        <BudgetSettingModal 
          settings={budget} 
          onSave={handleUpdateSettings} 
          onClose={() => setIsSettingModalOpen(false)} 
        />
      )}

      {isCategoryModalOpen && (
        <CategoryModal
          initialData={editingCategory}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        />
      )}
    </div>
  );
};