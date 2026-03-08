/**
 * Property-Based Test: 사진 순서 변경 보존
 * Feature: beta-readiness-review, Property 26: 사진 순서 변경 보존
 *
 * 순서 변경 후 조회 시 변경된 순서 유지 검증
 *
 * **Validates: Requirements 11.3**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

interface PhotoItem {
  id: number;
  sort_order: number;
}

/**
 * Simulates the backend reorder logic:
 * Given a list of photos and a reorder request (array of {id, sort_order}),
 * applies the new sort_order values and returns the list sorted by sort_order ASC.
 */
function applyReorder(
  photos: PhotoItem[],
  orders: { id: number; sort_order: number }[]
): PhotoItem[] {
  const orderMap = new Map(orders.map(o => [o.id, o.sort_order]));
  const updated = photos.map(p => ({
    ...p,
    sort_order: orderMap.has(p.id) ? orderMap.get(p.id)! : p.sort_order,
  }));
  return updated.sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Simulates arrayMove (same as @dnd-kit/sortable arrayMove):
 * Moves element from oldIndex to newIndex.
 */
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

/** Arbitrary: unique photo list with sequential IDs */
const photoListArb = fc
  .integer({ min: 2, max: 20 })
  .map(n =>
    Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      sort_order: i,
    }))
  );

describe('Feature: beta-readiness-review, Property 26: 사진 순서 변경 보존', () => {
  it('should preserve reordered sequence after applying sort_order updates', () => {
    fc.assert(
      fc.property(
        photoListArb.chain(photos =>
          fc.tuple(
            fc.constant(photos),
            fc.integer({ min: 0, max: photos.length - 1 }),
            fc.integer({ min: 0, max: photos.length - 1 })
          )
        ),
        ([photos, fromIndex, toIndex]) => {
          // Simulate a drag from fromIndex to toIndex
          const reordered = arrayMove(photos, fromIndex, toIndex);

          // Generate the orders payload (new sort_order = new index)
          const orders = reordered.map((p, i) => ({ id: p.id, sort_order: i }));

          // Apply reorder to original photos (simulates backend)
          const result = applyReorder(photos, orders);

          // The result should match the reordered sequence
          expect(result.map(p => p.id)).toEqual(reordered.map(p => p.id));

          // sort_order values should be sequential
          for (let i = 0; i < result.length; i++) {
            expect(result[i].sort_order).toBe(i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain all photo IDs after reorder (no duplicates, no loss)', () => {
    fc.assert(
      fc.property(
        photoListArb.chain(photos =>
          fc.tuple(
            fc.constant(photos),
            fc.integer({ min: 0, max: photos.length - 1 }),
            fc.integer({ min: 0, max: photos.length - 1 })
          )
        ),
        ([photos, fromIndex, toIndex]) => {
          const reordered = arrayMove(photos, fromIndex, toIndex);
          const orders = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
          const result = applyReorder(photos, orders);

          const originalIds = new Set(photos.map(p => p.id));
          const resultIds = new Set(result.map(p => p.id));

          expect(resultIds).toEqual(originalIds);
          expect(result.length).toBe(photos.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
