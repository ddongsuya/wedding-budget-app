import apiClient from './client';

export interface BudgetSettings {
  total_budget?: number;
  groom_ratio?: number;
  bride_ratio?: number;
}

export interface BudgetCategoryInput {
  name: string;
  icon?: string;
  parent_id?: number;
  budget_amount?: number;
  color?: string;
  order?: number;
}

export const budgetAPI = {
  // 예산 설정
  getSettings: () => apiClient.get('/budget'),
  updateSettings: (data: BudgetSettings) => apiClient.put('/budget', data),

  // 카테고리
  getCategories: () => apiClient.get('/budget/categories'),
  createCategory: (data: BudgetCategoryInput) => apiClient.post('/budget/categories', data),
  updateCategory: (id: string, data: Partial<BudgetCategoryInput>) =>
    apiClient.put(`/budget/categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete(`/budget/categories/${id}`),
};
