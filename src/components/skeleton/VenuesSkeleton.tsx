import React from 'react';
import { Skeleton } from '../common/Skeleton/Skeleton';

export const VenuesSkeleton = () => {
  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start md:items-center">
          <div>
            <Skeleton variant="text" width={150} height={28} className="mb-2" />
            <Skeleton variant="text" width={250} height={16} />
          </div>
          <Skeleton variant="rounded" width={100} height={40} className="hidden md:block" />
        </div>

        {/* Toolbar */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
          <Skeleton variant="rounded" width="100%" height={40} />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <Skeleton variant="text" width={180} height={24} />
                <Skeleton variant="text" width={120} height={14} />
              </div>
              <Skeleton variant="rounded" width={60} height={24} />
            </div>
            <Skeleton variant="rounded" width="100%" height={200} className="mb-4" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton variant="text" width="100%" height={16} />
              <Skeleton variant="text" width="100%" height={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="rounded" width={48} height={48} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="40%" height={14} />
              </div>
              <Skeleton variant="text" width={100} height={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
