import React from 'react';
import { Skeleton } from '../common/Skeleton/Skeleton';

export const SettingsSkeleton = () => {
  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" width={48} height={48} />
        <div>
          <Skeleton variant="text" width={120} height={28} className="mb-1" />
          <Skeleton variant="text" width={180} height={16} />
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-stone-200 pb-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="rounded" width={100} height={40} />
        ))}
      </div>

      {/* 프로필 이미지 섹션 */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 shadow-sm">
        <Skeleton variant="text" width={120} height={24} className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton variant="circular" width={128} height={128} className="mb-3" />
              <Skeleton variant="text" width={80} height={16} />
            </div>
          ))}
        </div>
      </div>

      {/* 폼 섹션들 */}
      {[1, 2, 3].map(section => (
        <div key={section} className="bg-white rounded-xl p-6 shadow-sm">
          <Skeleton variant="text" width={100} height={24} className="mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(field => (
              <div key={field}>
                <Skeleton variant="text" width={80} height={16} className="mb-2" />
                <Skeleton variant="rounded" width="100%" height={44} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Skeleton variant="rounded" width={160} height={48} />
      </div>
    </div>
  );
};
