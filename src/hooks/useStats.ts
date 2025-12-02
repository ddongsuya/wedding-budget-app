import { useState, useCallback } from 'react';
import { statsAPI } from '../api/stats';

export const useStats = () => {
  const [summary, setSummary] = useState<any>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [byMonth, setByMonth] = useState<any[]>([]);
  const [byPayer, setByPayer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await statsAPI.getSummary();
      setSummary(response.data.summary);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '요약 통계를 불러오는데 실패했습니다';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByCategory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await statsAPI.getByCategory();
      setByCategory(response.data.categories);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '카테고리별 통계를 불러오는데 실패했습니다';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await statsAPI.getByMonth();
      setByMonth(response.data.months);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '월별 통계를 불러오는데 실패했습니다';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByPayer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await statsAPI.getByPayer();
      setByPayer(response.data.payers);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '분담자별 통계를 불러오는데 실패했습니다';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    summary,
    byCategory,
    byMonth,
    byPayer,
    loading,
    error,
    fetchSummary,
    fetchByCategory,
    fetchByMonth,
    fetchByPayer,
  };
};
