import { useState, useCallback, useEffect } from 'react';

export const DRAFT_PREFIX = 'form_draft_';

export function getStorageKey(key: string): string {
  return `${DRAFT_PREFIX}${key}`;
}

export function readDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted data — remove it silently
    localStorage.removeItem(getStorageKey(key));
    return null;
  }
}

export function saveDraft<T>(key: string, data: T): void {
  localStorage.setItem(getStorageKey(key), JSON.stringify(data));
}

export function removeDraft(key: string): void {
  localStorage.removeItem(getStorageKey(key));
}

export function useFormDraft<T>(key: string) {
  const [draft, setDraftState] = useState<T | null>(() => readDraft<T>(key));

  // Sync state when key changes
  useEffect(() => {
    setDraftState(readDraft<T>(key));
  }, [key]);

  const setDraft = useCallback(
    (data: T) => {
      try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(data));
        setDraftState(data);
      } catch {
        // localStorage full or unavailable — ignore silently
      }
    },
    [key],
  );

  const clearDraft = useCallback(() => {
    localStorage.removeItem(getStorageKey(key));
    setDraftState(null);
  }, [key]);

  const hasDraft = draft !== null;

  return { draft, setDraft, clearDraft, hasDraft };
}
