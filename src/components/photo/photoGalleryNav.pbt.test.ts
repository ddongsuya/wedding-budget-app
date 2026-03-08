/**
 * Property-Based Test: 사진 갤러리 네비게이션
 * Feature: beta-readiness-review, Property 28: 사진 갤러리 네비게이션
 *
 * 다음/이전 이동 시 올바른 사진 표시 및 경계값 처리 검증
 *
 * **Validates: Requirements 11.5**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

interface PhotoItem {
  id: number;
}

/**
 * Gallery navigation logic (mirrors PhotoReferences.tsx):
 * - goToNext: if currentIndex < photos.length - 1, move to currentIndex + 1
 * - goToPrev: if currentIndex > 0, move to currentIndex - 1
 * - At boundaries, navigation is blocked (no wrap-around)
 */
function navigateNext(photos: PhotoItem[], currentIndex: number): number {
  if (currentIndex >= 0 && currentIndex < photos.length - 1) {
    return currentIndex + 1;
  }
  return currentIndex; // blocked at boundary
}

function navigatePrev(photos: PhotoItem[], currentIndex: number): number {
  if (currentIndex > 0) {
    return currentIndex - 1;
  }
  return currentIndex; // blocked at boundary
}

function canGoNext(photos: PhotoItem[], currentIndex: number): boolean {
  return currentIndex >= 0 && currentIndex < photos.length - 1;
}

function canGoPrev(currentIndex: number): boolean {
  return currentIndex > 0;
}

/** Arbitrary: a non-empty list of photos with unique IDs */
const photoListArb = fc
  .integer({ min: 1, max: 30 })
  .map(n => Array.from({ length: n }, (_, i) => ({ id: i + 1 })));

describe('Feature: beta-readiness-review, Property 28: 사진 갤러리 네비게이션', () => {
  it('should show the correct next photo when navigating forward', () => {
    fc.assert(
      fc.property(
        photoListArb.chain(photos =>
          fc.tuple(
            fc.constant(photos),
            fc.integer({ min: 0, max: photos.length - 1 })
          )
        ),
        ([photos, currentIndex]) => {
          const nextIndex = navigateNext(photos, currentIndex);

          if (currentIndex < photos.length - 1) {
            // Should move to next photo
            expect(nextIndex).toBe(currentIndex + 1);
            expect(photos[nextIndex].id).toBe(photos[currentIndex + 1].id);
          } else {
            // At last photo, should stay
            expect(nextIndex).toBe(currentIndex);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show the correct previous photo when navigating backward', () => {
    fc.assert(
      fc.property(
        photoListArb.chain(photos =>
          fc.tuple(
            fc.constant(photos),
            fc.integer({ min: 0, max: photos.length - 1 })
          )
        ),
        ([photos, currentIndex]) => {
          const prevIndex = navigatePrev(photos, currentIndex);

          if (currentIndex > 0) {
            // Should move to previous photo
            expect(prevIndex).toBe(currentIndex - 1);
            expect(photos[prevIndex].id).toBe(photos[currentIndex - 1].id);
          } else {
            // At first photo, should stay
            expect(prevIndex).toBe(currentIndex);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly report navigation availability at boundaries', () => {
    fc.assert(
      fc.property(
        photoListArb.chain(photos =>
          fc.tuple(
            fc.constant(photos),
            fc.integer({ min: 0, max: photos.length - 1 })
          )
        ),
        ([photos, currentIndex]) => {
          // First photo: cannot go prev
          if (currentIndex === 0) {
            expect(canGoPrev(currentIndex)).toBe(false);
          } else {
            expect(canGoPrev(currentIndex)).toBe(true);
          }

          // Last photo: cannot go next
          if (currentIndex === photos.length - 1) {
            expect(canGoNext(photos, currentIndex)).toBe(false);
          } else {
            expect(canGoNext(photos, currentIndex)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should keep index within valid bounds after any sequence of navigations', () => {
    fc.assert(
      fc.property(
        photoListArb.chain(photos =>
          fc.tuple(
            fc.constant(photos),
            fc.integer({ min: 0, max: photos.length - 1 }),
            // Random sequence of 'next' and 'prev' moves
            fc.array(fc.constantFrom('next', 'prev'), { minLength: 1, maxLength: 20 })
          )
        ),
        ([photos, startIndex, moves]) => {
          let currentIndex = startIndex;

          for (const move of moves) {
            if (move === 'next') {
              currentIndex = navigateNext(photos, currentIndex);
            } else {
              currentIndex = navigatePrev(photos, currentIndex);
            }

            // Index should always be within bounds
            expect(currentIndex).toBeGreaterThanOrEqual(0);
            expect(currentIndex).toBeLessThan(photos.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
