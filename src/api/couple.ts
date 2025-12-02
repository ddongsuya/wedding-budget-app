import apiClient from './client';

export interface CoupleProfileData {
  groom_name?: string;
  groom_birth_date?: string;
  groom_contact?: string;
  bride_name?: string;
  bride_birth_date?: string;
  bride_contact?: string;
  first_met_date?: string;
  wedding_date?: string;
  couple_nickname?: string;
}

export const coupleAPI = {
  // 커플 연결
  invite: () => apiClient.post('/couple/invite'),
  join: (inviteCode: string) => apiClient.post('/couple/join', { inviteCode }),
  getCouple: () => apiClient.get('/couple'),

  // 프로필
  getProfile: () => apiClient.get('/couple/profile'),
  updateProfile: (data: CoupleProfileData) => apiClient.put('/couple/profile', data),

  // 이미지 업로드
  uploadGroomImage: (formData: FormData) =>
    apiClient.post('/couple/profile/groom-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadBrideImage: (formData: FormData) =>
    apiClient.post('/couple/profile/bride-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadCoupleImage: (formData: FormData) =>
    apiClient.post('/couple/profile/couple-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
