import { useState, useEffect, useCallback } from 'react';
import { budgetAPI, BudgetSettings, BudgetCategoryInput } from '../api/budget';

export interface BudgetCategory {
  id: number;
  name: string;
  icon?: string;
  budget_amount: number;
  spent_amount: number;
  color?: string;
  order: number;
}

export const useBudget = () => {
  const [settings, setSettings] = useState<any>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await budgetAPI.getSettings();
      console.log('[DEBUG] Budget API raw response:', response.data);
      const budget = response.data.budget;
      // 숫자 타입 보장
      if (budget) {
        console.log('[DEBUG] Before conversion - total_budget:', budget.total_budget, 'type:', typeof budget.total_budget);
        budget.total_budget = Number(budget.total_budget) || 0;
        budget.groom_ratio = Number(budget.groom_ratio) || 50;
        budget.bride_ratio = Number(budget.bride_ratio) || 50;
        console.log('[DEBUG] After conversion - total_budget:', budget.total_budget, 'type:', typeof budget.total_budget);
      }
      setSettings(budget);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '예산 설정을 불러오는데 실패했습니다';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (data: BudgetSettings) => {
    setLoading(true);
    setError(null);
    try {
      const response = await budgetAPI.updateSettings(data);
      setSettings(response.data.budget);
      return response.data.budget;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '예산 설정 수정에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await budgetAPI.getCategories();
      console.log('[DEBUG] Categories API raw response:', response.data);
      // 숫자 타입 보장
      const categories = (response.data.categories || []).map((c: any) => {
        console.log('[DEBUG] Category before conversion:', c.name, 'budget_amount:', c.budget_amount, 'type:', typeof c.budget_amount);
        return {
          ...c,
          budget_amount: Number(c.budget_amount) || 0,
          spent_amount: Number(c.spent_amount) || 0,
        };
      });
      setCategories(categories);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '카테고리를 불러오는데 실패했습니다';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = async (data: BudgetCategoryInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await budgetAPI.createCategory(data);
      const newCategory = response.data.category;
      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '카테고리 추가에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, data: Partial<BudgetCategoryInput>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await budgetAPI.updateCategory(id, data);
      const updatedCategory = response.data.category;
      setCategories((prev) => prev.map((c) => (c.id === parseInt(id) ? updatedCategory : c)));
      return updatedCategory;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '카테고리 수정에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await budgetAPI.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== parseInt(id)));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '카테고리 삭제에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, [fetchSettings, fetchCategories]);

  return {
    settings,
    categories,
    loading,
    error,
    fetchSettings,
    updateSettings,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
