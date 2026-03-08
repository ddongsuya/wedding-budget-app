import { describe, it, expect, beforeEach } from 'vitest';
import {
  DRAFT_PREFIX,
  getStorageKey,
  readDraft,
  saveDraft,
  removeDraft,
} from './useFormDraft';

describe('useFormDraft – pure helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getStorageKey should prefix with form_draft_', () => {
    expect(getStorageKey('contract')).toBe('form_draft_contract');
    expect(DRAFT_PREFIX).toBe('form_draft_');
  });

  it('readDraft should return null when no draft exists', () => {
    expect(readDraft('nonexistent')).toBeNull();
  });

  it('saveDraft + readDraft should round-trip an object', () => {
    const data = { name: '웨딩홀A', price: 5000000 };
    saveDraft('venue', data);
    expect(readDraft('venue')).toEqual(data);
  });

  it('saveDraft + readDraft should round-trip an array', () => {
    const data = [1, 2, 3];
    saveDraft('list', data);
    expect(readDraft('list')).toEqual(data);
  });

  it('readDraft should return null and clean up corrupted data', () => {
    localStorage.setItem(getStorageKey('bad'), '{corrupted');
    expect(readDraft('bad')).toBeNull();
    // Corrupted entry should be removed
    expect(localStorage.getItem(getStorageKey('bad'))).toBeNull();
  });

  it('removeDraft should clear the draft', () => {
    saveDraft('temp', { a: 1 });
    removeDraft('temp');
    expect(readDraft('temp')).toBeNull();
  });

  it('removeDraft on non-existent key should not throw', () => {
    expect(() => removeDraft('nope')).not.toThrow();
  });
});
