import React from 'react';
import { Skeleton } from '../common/Skeleton/Skeleton';

export const ScheduleSkeleton = () => {
  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      {/* 헤더 스켈레톤 */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-[60px] md:top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="text-center">
            <Skeleton variant="text" width={120} height={24} className="mx-auto mb-1" />
            <Skeleton variant="text" width={40} height={16} className="mx-auto" />
          </div>
          <Skeleton variant="circular" width={40} height={40} />
        </div>

        {/* 일정 추가 버튼 */}
        <Skeleton variant="rounded" width="100%" height={44} className="mb-4" />

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} variant="text" width="100%" height={20} />
          ))}
        </div>
      </div>

      {/* 캘린더 그리드 스켈레톤 */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden p-2">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 p-1 flex flex-col items-center">
              <Skeleton variant="circular" width={28} height={28} className="mb-1" />
              <div className="flex gap-0.5">
                <Skeleton variant="circular" width={6} height={6} />
                <Skeleton variant="circular" width={6} height={6} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 다가오는 일정 스켈레톤 */}
      <div className="mx-4 mt-4">
        <Skeleton variant="text" width={120} height={24} className="mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1">
                <Skeleton variant="text" width="60%" height={18} className="mb-1" />
                <Skeleton variant="text" width="40%" height={14} />
              </div>
              <Skeleton variant="rounded" width={20} height={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
