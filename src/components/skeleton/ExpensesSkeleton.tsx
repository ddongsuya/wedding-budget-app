import React from 'react';
import { Skeleton } from '../common/Skeleton/Skeleton';

export const ExpensesSkeleton = () => {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton variant="text" width={150} height={28} className="mb-2" />
            <Skeleton variant="text" width={250} height={16} />
          </div>
          <Skeleton variant="rounded" width={120} height={40} />
        </div>

        {/* Toolbar */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
          <Skeleton variant="rounded" width="100%" height={40} />
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="rounded" width={8} height={40} />
                <div className="space-y-2">
                  <Skeleton variant="text" width={150} height={18} />
                  <Skeleton variant="text" width={100} height={12} />
                </div>
              </div>
              <Skeleton variant="rounded" width={50} height={20} />
            </div>
            <div className="flex justify-between items-end border-t border-stone-50 pt-3">
              <Skeleton variant="text" width={120} height={12} />
              <Skeleton variant="text" width={100} height={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
