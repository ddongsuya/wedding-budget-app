import apiClient from './client';

export const statsAPI = {
  getSummary: () => apiClient.get('/stats/summary'),
  getByCategory: () => apiClient.get('/stats/by-category'),
  getByMonth: () => apiClient.get('/stats/by-month'),
  getByPayer: () => apiClient.get('/stats/by-payer'),
};
