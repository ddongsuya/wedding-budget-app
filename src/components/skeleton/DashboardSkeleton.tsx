import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      {/* 커플 헤더 스켈레톤 */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              <Skeleton variant="circular" width={80} height={80} />
              <Skeleton variant="circular" width={80} height={80} />
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" width={200} height={28} />
              <Skeleton variant="text" width={150} height={20} />
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <Skeleton variant="text" width={60} height={16} className="mb-1" />
              <Skeleton variant="text" width={80} height={28} />
            </div>
            <div className="text-center">
              <Skeleton variant="text" width={60} height={16} className="mb-1" />
              <Skeleton variant="text" width={80} height={28} />
            </div>
          </div>
        </div>
      </div>

      {/* 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <Skeleton variant="text" width="60%" height={14} className="mb-2" />
            <Skeleton variant="text" width="80%" height={28} className="mb-1" />
            <Skeleton variant="text" width="50%" height={12} />
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <Skeleton variant="text" width="40%" height={20} className="mb-4" />
          <Skeleton variant="rounded" width="100%" height={300} />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <Skeleton variant="text" width="30%" height={20} className="mb-4" />
          <Skeleton variant="circular" width={160} height={160} className="mx-auto" />
        </div>
      </div>

      {/* 최근 지출 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <Skeleton variant="text" width="40%" height={20} className="mb-4" />
          <Skeleton variant="rounded" width="100%" height={250} />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <Skeleton variant="text" width="30%" height={20} className="mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="70%" height={14} />
                  <Skeleton variant="text" width="40%" height={12} />
                </div>
                <Skeleton variant="text" width={80} height={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
