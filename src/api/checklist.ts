import apiClient from './client';
import { ChecklistCategory, ChecklistItem, ChecklistStats, ChecklistFilters } from '../types/checklist';

export const checklistAPI = {
  // 카테고리
  getCategories: () =>
    apiClient.get<{ success: boolean; data: ChecklistCategory[] }>('/checklist/categories'),
  
  createCategory: (data: Partial<ChecklistCategory>) =>
    apiClient.post('/checklist/categories', data),
  
  updateCategory: (id: string, data: Partial<ChecklistCategory>) =>
    apiClient.put(`/checklist/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    apiClient.delete(`/checklist/categories/${id}`),

  // 아이템
  getItems: (filters?: ChecklistFilters) =>
    apiClient.get<{ success: boolean; data: ChecklistItem[] }>('/checklist/items', { params: filters }),
  
  getItem: (id: string) =>
    apiClient.get<{ success: boolean; data: ChecklistItem }>(`/checklist/items/${id}`),
  
  createItem: (data: Partial<ChecklistItem>) =>
    apiClient.post('/checklist/items', data),
  
  updateItem: (id: string, data: Partial<ChecklistItem>) =>
    apiClient.put(`/checklist/items/${id}`, data),
  
  deleteItem: (id: string) =>
    apiClient.delete(`/checklist/items/${id}`),

  // 완료 토글
  toggleComplete: (id: string) =>
    apiClient.patch(`/checklist/items/${id}/toggle`),

  // 통계
  getStats: () =>
    apiClient.get<{ success: boolean; data: ChecklistStats }>('/checklist/stats'),

  // 기본 템플릿 초기화
  initDefaults: () =>
    apiClient.post('/checklist/init-defaults'),
};
