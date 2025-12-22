import React from 'react';
import { Skeleton } from '../common/Skeleton/Skeleton';

export const BudgetSkeleton = () => {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton variant="text" width={150} height={28} className="mb-2" />
          <Skeleton variant="text" width={250} height={16} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" width={80} height={36} />
          <Skeleton variant="rounded" width={120} height={36} />
        </div>
      </div>

      {/* 메인 예산 카드 */}
      <div className="bg-stone-800 rounded-2xl p-6">
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center sm:text-left">
              <Skeleton variant="text" width="60%" height={14} className="mb-2 bg-stone-700" />
              <Skeleton variant="text" width="80%" height={28} className="bg-stone-700" />
            </div>
          ))}
        </div>
        
        {/* 분담 바 */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <Skeleton variant="text" width={200} height={16} className="bg-stone-700" />
            <div className="w-full md:w-1/2">
              <div className="flex justify-between mb-1.5">
                <Skeleton variant="text" width={80} height={12} className="bg-stone-700" />
                <Skeleton variant="text" width={80} height={12} className="bg-stone-700" />
              </div>
              <Skeleton variant="rounded" width="100%" height={8} className="bg-stone-700" />
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 리스트 */}
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div>
                  <Skeleton variant="text" width={120} height={18} className="mb-1" />
                  <Skeleton variant="text" width={80} height={14} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <Skeleton variant="text" width={100} height={18} className="mb-1" />
                  <Skeleton variant="text" width={80} height={14} />
                </div>
                <Skeleton variant="circular" width={32} height={32} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
