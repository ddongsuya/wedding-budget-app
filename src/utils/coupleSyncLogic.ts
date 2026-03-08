/**
 * 커플 동기화 핵심 로직 (순수 함수)
 * useCoupleSync 훅에서 사용하는 변경 감지 로직을 테스트 가능하게 분리
 *
 * Requirements: 13.1 - 커플 파트너 데이터 변경 시 상대방 화면에 반영
 */

export interface SyncState {
  lastKnownTimestamp: string | null;
  isConnected: boolean;
  partnerName: string | null;
  partnerLastActivity: string | null;
}

export interface PollResponse {
  lastActivityAt: string | null;
  partnerName: string | null;
}

export interface SyncResult {
  newState: SyncState;
  shouldInvalidate: boolean;
}

/**
 * 폴링 응답을 처리하여 새 상태와 무효화 여부를 결정한다.
 * - 첫 호출(lastKnownTimestamp === null)이면 타임스탬프만 저장
 * - 타임스탬프가 변경되었으면 shouldInvalidate = true
 */
export function processPollResponse(
  currentState: SyncState,
  response: PollResponse,
): SyncResult {
  const newState: SyncState = {
    lastKnownTimestamp: currentState.lastKnownTimestamp,
    isConnected: !!response.partnerName,
    partnerName: response.partnerName,
    partnerLastActivity: response.lastActivityAt,
  };

  // 첫 호출이면 타임스탬프만 저장, 무효화 안 함
  if (currentState.lastKnownTimestamp === null) {
    newState.lastKnownTimestamp = response.lastActivityAt;
    return { newState, shouldInvalidate: false };
  }

  // 타임스탬프가 변경되었으면 무효화
  if (
    response.lastActivityAt &&
    response.lastActivityAt !== currentState.lastKnownTimestamp
  ) {
    newState.lastKnownTimestamp = response.lastActivityAt;
    return { newState, shouldInvalidate: true };
  }

  return { newState, shouldInvalidate: false };
}

/**
 * 초기 동기화 상태를 생성한다.
 */
export function createInitialSyncState(): SyncState {
  return {
    lastKnownTimestamp: null,
    isConnected: false,
    partnerName: null,
    partnerLastActivity: null,
  };
}
