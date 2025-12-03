import React from 'react';
import { Skeleton } from '../common/Skeleton/Skeleton';

export const ChecklistSkeleton = () => {
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* 헤더 스켈레톤 */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <Skeleton variant="text" width={120} height={28} className="mb-4" />
        
        {/* 진행률 */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <Skeleton variant="text" width={60} height={16} />
            <Skeleton variant="text" width={40} height={16} />
          </div>
          <Skeleton variant="rounded" width="100%" height={8} />
          <div className="flex justify-between mt-1">
            <Skeleton variant="text" width={60} height={12} />
            <Skeleton variant="text" width={60} height={12} />
          </div>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rounded" width={80} height={36} />
          ))}
        </div>
      </div>

      {/* 리스트 스켈레톤 */}
      <div className="p-4 space-y-6">
        {[1, 2, 3].map(group => (
          <div key={group} className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width={150} height={20} />
              <Skeleton variant="text" width={40} height={16} />
            </div>
            {[1, 2, 3, 4].map(item => (
              <div key={item} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <Skeleton variant="circular" width={24} height={24} />
                <div className="flex-1">
                  <Skeleton variant="text" width="70%" height={18} className="mb-1" />
                  <Skeleton variant="text" width="30%" height={14} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
