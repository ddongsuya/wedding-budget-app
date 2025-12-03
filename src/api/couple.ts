import apiClient from './client';

export interface CoupleInfo {
  id: string;
  invite_code: string;
  groom_name: string | null;
  bride_name: string | null;
  wedding_date: string | null;
  total_budget: number;
  groom_image_url: string | null;
  bride_image_url: string | null;
  couple_image_url: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

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
  // 커플 정보 조회
  getCoupleInfo: () =>
    apiClient.get<{
      success: boolean;
      data: {
        couple: CoupleInfo | null;
        partner: PartnerInfo | null;
        isConnected: boolean;
      } | null;
    }>('/couple'),

  // 커플 생성 (초대 코드 발급)
  createCouple: () =>
    apiClient.post<{
      success: boolean;
      data: { couple: CoupleInfo; inviteCode: string };
      message: string;
    }>('/couple/create'),

  // 초대 코드로 커플 연결
  joinCouple: (inviteCode: string) =>
    apiClient.post<{
      success: boolean;
      data: { couple: CoupleInfo; partner: PartnerInfo };
      message: string;
    }>('/couple/join', { inviteCode }),

  // 초대 코드 재생성
  regenerateInviteCode: () =>
    apiClient.post<{
      success: boolean;
      data: { inviteCode: string };
      message: string;
    }>('/couple/regenerate-code'),

  // 커플 프로필 수정
  updateCoupleProfile: (data: Partial<CoupleInfo>) =>
    apiClient.put<{
      success: boolean;
      data: CoupleInfo;
      message: string;
    }>('/couple/profile', data),

  // 커플 연결 해제
  leaveCouple: () =>
    apiClient.post<{
      success: boolean;
      message: string;
    }>('/couple/leave'),

  // 파트너 정보 조회
  getPartnerInfo: () =>
    apiClient.get<{ success: boolean; data: PartnerInfo | null }>('/couple/partner'),

  // 기존 프로필 API (호환성 유지)
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
