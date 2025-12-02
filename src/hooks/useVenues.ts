import { useState, useEffect, useCallback } from 'react';
import { venueAPI, VenueCreateInput, VenueUpdateInput, VenueListParams } from '../api/venues';
import { Venue } from '../types';

export const useVenues = (params?: VenueListParams) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchVenues = useCallback(async (fetchParams?: VenueListParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await venueAPI.getList(fetchParams || params);
      setVenues(response.data.venues);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '식장 목록을 불러오는데 실패했습니다';
      setError(errorMsg);
      
      // 오프라인 폴백
      const cached = localStorage.getItem('venues_cache');
      if (cached) {
        setVenues(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  const addVenue = async (data: VenueCreateInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await venueAPI.create(data);
      const newVenue = response.data.venue;
      setVenues((prev) => [...prev, newVenue]);
      return newVenue;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '식장 추가에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVenue = async (id: string, data: VenueUpdateInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await venueAPI.update(id, data);
      const updatedVenue = response.data.venue;
      setVenues((prev) => prev.map((v) => (v.id === id ? updatedVenue : v)));
      return updatedVenue;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '식장 수정에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVenue = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await venueAPI.delete(id);
      setVenues((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '식장 삭제에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // 캐시 저장
  useEffect(() => {
    if (venues.length > 0) {
      localStorage.setItem('venues_cache', JSON.stringify(venues));
    }
  }, [venues]);

  return {
    venues,
    loading,
    error,
    pagination,
    fetchVenues,
    addVenue,
    updateVenue,
    deleteVenue,
  };
};
