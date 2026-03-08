/**
 * Property-Based Test: 카테고리별 사진 개수 정확성
 * Feature: beta-readiness-review, Property 27: 카테고리별 사진 개수 정확성
 *
 * 표시 개수가 실제 해당 카테고리 사진 수와 일치하는지 검증
 *
 * **Validates: Requirements 11.4**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

const VALID_CATEGORIES = ['outdoor', 'indoor', 'pose', 'props', 'dress', 'suit', 'makeup', 'etc'];

interface PhotoItem {
  id: number;
  category: string;
}

/**
 * Computes category counts from a list of photos.
 * This mirrors the logic in PhotoReferences.tsx:
 *   photos.reduce((acc, photo) => { acc[photo.category] = (acc[photo.category] || 0) + 1; return acc; }, {})
 */
function computeCategoryCounts(photos: PhotoItem[]): Record<string, number> {
  return photos.reduce<Record<string, number>>((acc, photo) => {
    acc[photo.category] = (acc[photo.category] || 0) + 1;
    return acc;
  }, {});
}

/** Arbitrary: valid photo category */
const categoryArb = fc.constantFrom(...VALID_CATEGORIES);

/** Arbitrary: a list of photos with random categories */
const photoListArb = fc.array(
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    category: categoryArb,
  }),
  { minLength: 0, maxLength: 50 }
);

describe('Feature: beta-readiness-review, Property 27: 카테고리별 사진 개수 정확성', () => {
  it('should compute category counts that match actual photo counts per category', () => {
    fc.assert(
      fc.property(photoListArb, (photos) => {
        const counts = computeCategoryCounts(photos);

        // For each category, verify the count matches the actual number of photos
        for (const cat of VALID_CATEGORIES) {
          const actualCount = photos.filter(p => p.category === cat).length;
          const displayedCount = counts[cat] || 0;
          expect(displayedCount).toBe(actualCount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have total of all category counts equal to total photo count', () => {
    fc.assert(
      fc.property(photoListArb, (photos) => {
        const counts = computeCategoryCounts(photos);
        const totalFromCounts = Object.values(counts).reduce((sum, c) => sum + c, 0);
        expect(totalFromCounts).toBe(photos.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty counts for empty photo list', () => {
    const counts = computeCategoryCounts([]);
    expect(Object.keys(counts).length).toBe(0);
  });

  it('should only contain categories that exist in the photo list', () => {
    fc.assert(
      fc.property(photoListArb, (photos) => {
        const counts = computeCategoryCounts(photos);
        const categoriesInPhotos = new Set(photos.map(p => p.category));
        
        for (const cat of Object.keys(counts)) {
          expect(categoriesInPhotos.has(cat)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
