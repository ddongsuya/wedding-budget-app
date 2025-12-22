import React from 'react';
import { Skeleton } from '../common/Skeleton/Skeleton';

export const PhotoReferencesSkeleton = () => {
  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      {/* 헤더 스켈레톤 */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-[60px] md:top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton variant="text" width={160} height={24} className="mb-1" />
            <Skeleton variant="text" width={200} height={16} />
          </div>
          <Skeleton variant="rounded" width={100} height={40} />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} variant="rounded" width={70} height={32} className="flex-shrink-0" />
          ))}
        </div>

        {/* 필터 옵션 */}
        <div className="flex items-center justify-between mt-3">
          <Skeleton variant="rounded" width={100} height={32} />
          <Skeleton variant="rounded" width={70} height={32} />
        </div>
      </div>

      {/* 그리드 스켈레톤 */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="aspect-square">
                <Skeleton variant="rectangular" width="100%" height="100%" />
              </div>
              <div className="absolute top-2 left-2">
                <Skeleton variant="rounded" width={60} height={24} />
              </div>
              <div className="absolute top-2 right-2">
                <Skeleton variant="circular" width={28} height={28} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 콘텐츠 영역만 스켈레톤 (헤더 제외)
export const PhotoReferencesGridSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="relative rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="aspect-square">
            <Skeleton variant="rectangular" width="100%" height="100%" />
          </div>
          <div className="absolute top-2 left-2">
            <Skeleton variant="rounded" width={60} height={24} />
          </div>
          <div className="absolute top-2 right-2">
            <Skeleton variant="circular" width={28} height={28} />
          </div>
        </div>
      ))}
    </div>
  );
};
