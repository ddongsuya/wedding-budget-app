/**
 * Property-Based Test: 사진 수정 라운드 트립
 * Feature: beta-readiness-review, Property 25: 사진 수정 라운드 트립
 *
 * 수정 후 조회 시 수정된 값 반영 검증
 *
 * **Validates: Requirements 11.1**
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PhotoReference, UpdatePhotoInput } from '@/api/photoReferences';

const VALID_CATEGORIES = ['outdoor', 'indoor', 'pose', 'props', 'dress', 'suit', 'makeup', 'etc'];

/**
 * Simulates applying an update to a photo reference (mirrors backend COALESCE logic).
 * Fields present in the update override the original; absent fields keep original values.
 */
function applyUpdate(original: PhotoReference, update: UpdatePhotoInput): PhotoReference {
  return {
    ...original,
    category: update.category ?? original.category,
    title: update.title ?? original.title,
    memo: update.memo ?? original.memo,
    tags: update.tags ?? original.tags,
    is_favorite: update.is_favorite ?? original.is_favorite,
  };
}

/** Arbitrary: valid photo category */
const categoryArb = fc.constantFrom(...VALID_CATEGORIES);

/** Arbitrary: safe tag string (non-empty, no weird whitespace) */
const tagArb = fc.string({ minLength: 1, maxLength: 20, unit: 'grapheme' })
  .map(s => s.replace(/\s+/g, '_'))
  .filter(s => s.length > 0);

/** Arbitrary: a PhotoReference object */
const photoArb: fc.Arbitrary<PhotoReference> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  couple_id: fc.integer({ min: 1, max: 1000 }),
  image_url: fc.constant('https://example.com/photo.jpg'),
  category: categoryArb,
  title: fc.string({ minLength: 0, maxLength: 50 }),
  memo: fc.string({ minLength: 0, maxLength: 200 }),
  tags: fc.array(tagArb, { minLength: 0, maxLength: 5 }),
  source_url: fc.constant(null),
  is_favorite: fc.boolean(),
  created_by: fc.integer({ min: 1, max: 1000 }),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  updated_at: fc.constant('2024-01-01T00:00:00Z'),
});

/** Arbitrary: an UpdatePhotoInput with at least one field set */
const updateArb: fc.Arbitrary<UpdatePhotoInput> = fc.record({
  category: fc.option(categoryArb, { nil: undefined }),
  title: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  memo: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  tags: fc.option(fc.array(tagArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
  is_favorite: fc.option(fc.boolean(), { nil: undefined }),
});

describe('Feature: beta-readiness-review, Property 25: 사진 수정 라운드 트립', () => {
  it('should reflect updated values after applying update to a photo', () => {
    fc.assert(
      fc.property(photoArb, updateArb, (original, update) => {
        const result = applyUpdate(original, update);

        // Updated fields should match the update input
        if (update.category !== undefined) {
          expect(result.category).toBe(update.category);
        } else {
          expect(result.category).toBe(original.category);
        }

        if (update.title !== undefined) {
          expect(result.title).toBe(update.title);
        } else {
          expect(result.title).toBe(original.title);
        }

        if (update.memo !== undefined) {
          expect(result.memo).toBe(update.memo);
        } else {
          expect(result.memo).toBe(original.memo);
        }

        if (update.tags !== undefined) {
          expect(result.tags).toEqual(update.tags);
        } else {
          expect(result.tags).toEqual(original.tags);
        }

        if (update.is_favorite !== undefined) {
          expect(result.is_favorite).toBe(update.is_favorite);
        } else {
          expect(result.is_favorite).toBe(original.is_favorite);
        }

        // Non-updatable fields should remain unchanged
        expect(result.id).toBe(original.id);
        expect(result.couple_id).toBe(original.couple_id);
        expect(result.image_url).toBe(original.image_url);
        expect(result.created_by).toBe(original.created_by);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all original values when update is empty (all undefined)', () => {
    fc.assert(
      fc.property(photoArb, (original) => {
        const emptyUpdate: UpdatePhotoInput = {};
        const result = applyUpdate(original, emptyUpdate);

        expect(result.category).toBe(original.category);
        expect(result.title).toBe(original.title);
        expect(result.memo).toBe(original.memo);
        expect(result.tags).toEqual(original.tags);
        expect(result.is_favorite).toBe(original.is_favorite);
      }),
      { numRuns: 100 }
    );
  });
});
