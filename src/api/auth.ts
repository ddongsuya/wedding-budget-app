import apiClient from './client';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authAPI = {
  register: (data: RegisterData) => apiClient.post('/auth/register', data),
  login: (data: LoginData) => apiClient.post('/auth/login', data),
  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  me: () => apiClient.get('/auth/me'),
  
  // 비밀번호 변경
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/auth/change-password', data),
  
  // 비밀번호 찾기
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  
  // 비밀번호 재설정
  resetPassword: (data: { email: string; token: string; newPassword: string }) =>
    apiClient.post('/auth/reset-password', data),
};
