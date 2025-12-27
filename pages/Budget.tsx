import React, { useState } from 'react';
import { BudgetSettings, BudgetCategory } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BudgetSettingModal } from '../components/budget/BudgetSettingModal';
import { CategoryModal } from '../components/budget/CategoryModal';
import { BudgetListView } from '../components/budget/BudgetListView';
import { Plus, Settings, Wallet, Heart } from 'lucide-react';
import { getIconByName } from '../src/utils/iconMap';
import { useToast } from '../src/hooks/useToast';
import { BudgetSkeleton } from '../src/components/skeleton/BudgetSkeleton';
import { EmptyState } from '../src/components/common/EmptyState';
import { useBudget } from '../src/hooks/useBudget';

const Budget: React.FC = () => {
  const { toast } = useToast();
  const { settings, categories, loading, fetchCategories, updateSettings, addCategory, updateCategory, deleteCategory } = useBudget();
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  // API 데이터를 기존 형식으로 변환
  const budget: BudgetSettings = {
    totalBudget: settings?.total_budget || 0,
    groomRatio: settings?.groom_ratio || 50,
    brideRatio: settings?.bride_ratio || 50,
    weddingDate: '',
    categories: categories.map(c => ({
      id: String(c.id),
      name: c.name,
      icon: c.icon || 'Circle',
      parentId: null,
      budgetAmount: c.budget_amount || 0,
      spentAmount: c.spent_amount || 0,
      color: c.color || '#f43f5e',
    })),
  };

  if (loading) {
    return <BudgetSkeleton />;
  }

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const calculateTotalAllocated = () => budget.categories.reduce((acc, c) => acc + c.budgetAmount, 0);
  const totalAllocated = calculateTotalAllocated();
  const unallocated = budget.totalBudget - totalAllocated;
  const totalSpent = budget.categories.reduce((acc, c) => acc + c.spentAmount, 0);

  // Ratio Calculations
  const groomAmount = budget.totalBudget * (budget.groomRatio / 100);
  const brideAmount = budget.totalBudget * (budget.brideRatio / 100);

  const handleUpdateSettings = async (newSettings: Partial<BudgetSettings>) => {
    try {
      await updateSettings({
        total_budget: newSettings.totalBudget,
        groom_ratio: newSettings.groomRatio,
        bride_ratio: newSettings.brideRatio,
      });
      toast.success('예산 설정이 저장되었습니다');
    } catch (_error) {
      toast.error('설정 저장에 실패했습니다');
    }
  };

  const handleSaveCategory = async (category: BudgetCategory) => {
    try {
      if (editingCategory) {
        await updateCategory(category.id, {
          name: category.name,
          icon: category.icon,
          budget_amount: category.budgetAmount,
          color: category.color,
        });
        toast.success('카테고리가 수정되었습니다');
      } else {
        await addCategory({
          name: category.name,
          icon: category.icon,
          budget_amount: category.budgetAmount,
          color: category.color,
        });
        toast.success('카테고리가 추가되었습니다');
      }
      await fetchCategories();
      setEditingCategory(null);
    } catch (_error) {
      toast.error('저장에 실패했습니다');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('이 카테고리를 삭제하시겠습니까? 관련 지출 내역은 유지되지만 예산 정보는 사라집니다.')) {
      try {
        await deleteCategory(id);
        toast.success('카테고리가 삭제되었습니다');
      } catch (_error) {
        toast.error('삭제에 실패했습니다');
      }
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = getIconByName(iconName);
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
        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 md:gap-8">
          <div className="text-center sm:text-left">
            <p className="text-stone-400 text-[10px] sm:text-xs md:text-sm mb-1 flex items-center justify-center sm:justify-start gap-1"><Wallet size={12}/> 총 예산</p>
            <p className="text-sm sm:text-lg md:text-2xl font-bold break-all">{formatMoney(budget.totalBudget)}</p>
          </div>
          <div className="text-center sm:text-left">
             <p className="text-stone-400 text-[10px] sm:text-xs md:text-sm mb-1">배정됨</p>
             <p className="text-sm sm:text-lg md:text-2xl font-semibold text-rose-300 break-all">{formatMoney(totalAllocated)}</p>
          </div>
          <div className="text-center sm:text-left">
             <p className="text-stone-400 text-[10px] sm:text-xs md:text-sm mb-1">지출액</p>
             <p className="text-sm sm:text-lg md:text-2xl font-semibold text-stone-100 break-all">{formatMoney(totalSpent)}</p>
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

      {/* Categories List - 리스트 뷰 */}
      {budget.categories.length === 0 ? (
        <EmptyState
          illustration="budget"
          title="예산 카테고리를 추가해주세요"
          description="식장, 스드메, 예복 등 항목별로 예산을 배분해보세요"
          actionLabel="카테고리 추가하기"
          onAction={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
        />
      ) : (
        <BudgetListView
          categories={budget.categories}
          onCategoryClick={(category) => { setEditingCategory(category); setIsCategoryModalOpen(true); }}
        />
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

export default Budget;
