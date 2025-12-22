import { useState, useEffect, useCallback } from 'react';
import { coupleAPI, CoupleProfileData } from '../api/couple';

export const useCoupleProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await coupleAPI.getProfile();
      setProfile(response.data.profile);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '프로필을 불러오는데 실패했습니다';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCouple = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await coupleAPI.getCoupleInfo();
      setCouple(response.data.data?.couple || null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '커플 정보를 불러오는데 실패했습니다';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (data: CoupleProfileData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await coupleAPI.updateProfile(data);
      setProfile(response.data.profile);
      return response.data.profile;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '프로필 수정에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadGroomImage = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await coupleAPI.uploadGroomImage(formData);
      setProfile(response.data.profile);
      return response.data.imageUrl;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '신랑 사진 업로드에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadBrideImage = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await coupleAPI.uploadBrideImage(formData);
      setProfile(response.data.profile);
      return response.data.imageUrl;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '신부 사진 업로드에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadCoupleImage = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await coupleAPI.uploadCoupleImage(formData);
      setProfile(response.data.profile);
      return response.data.imageUrl;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '커플 사진 업로드에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await coupleAPI.createCouple();
      return response.data.data.inviteCode;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '초대 코드 생성에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinCouple = async (inviteCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await coupleAPI.joinCouple(inviteCode);
      setCouple(response.data.data.couple);
      return response.data.data.couple;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '커플 연결에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCouple();
  }, [fetchProfile, fetchCouple]);

  return {
    profile,
    couple,
    loading,
    error,
    fetchProfile,
    fetchCouple,
    updateProfile,
    uploadGroomImage,
    uploadBrideImage,
    uploadCoupleImage,
    createInvite,
    joinCouple,
  };
};
