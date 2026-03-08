import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import { invalidateQueries } from '../lib/queryClient';

const POLL_INTERVAL = 30_000; // 30초

interface CoupleSyncResult {
  partnerLastActivity: string | null;
  isConnected: boolean;
  partnerName: string | null;
}

/**
 * 커플 동기화 훅
 * 30초 간격으로 파트너의 최근 활동을 폴링하여
 * 변경 감지 시 React Query 캐시를 무효화한다.
 *
 * Requirements: 13.1 - 커플 파트너 데이터 변경 시 상대방 화면에 반영
 */
export function useCoupleSync(): CoupleSyncResult {
  const { user } = useAuth();
  const [partnerLastActivity, setPartnerLastActivity] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const lastKnownTimestamp = useRef<string | null>(null);

  const hasCoupleId = !!(user?.coupleId || user?.couple_id);

  const fetchLastActivity = useCallback(async () => {
    try {
      const response = await apiClient.get('/couple/last-activity');
      const { lastActivityAt, partnerName } = response.data.data;

      setIsConnected(!!partnerName);
      setPartnerName(partnerName ?? null);
      setPartnerLastActivity(lastActivityAt ?? null);

      // 첫 호출이면 타임스탬프만 저장
      if (lastKnownTimestamp.current === null) {
        lastKnownTimestamp.current = lastActivityAt ?? null;
        return;
      }

      // 타임스탬프가 변경되었으면 관련 쿼리 무효화
      if (lastActivityAt && lastActivityAt !== lastKnownTimestamp.current) {
        lastKnownTimestamp.current = lastActivityAt;
        invalidateQueries.budget();
        invalidateQueries.expenses();
        invalidateQueries.checklist();
        invalidateQueries.events();
        invalidateQueries.venues();
      }
    } catch {
      // 네트워크 오류 등은 조용히 무시 — 다음 폴링에서 재시도
    }
  }, []);

  useEffect(() => {
    if (!hasCoupleId) {
      setIsConnected(false);
      setPartnerLastActivity(null);
      setPartnerName(null);
      lastKnownTimestamp.current = null;
      return;
    }

    // 즉시 한 번 호출
    fetchLastActivity();

    const intervalId = setInterval(fetchLastActivity, POLL_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasCoupleId, fetchLastActivity]);

  return { partnerLastActivity, isConnected, partnerName };
}
