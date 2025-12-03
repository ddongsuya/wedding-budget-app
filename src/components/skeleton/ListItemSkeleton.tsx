import React from 'react';
import { Skeleton } from '../common/Skeleton';

interface ListItemSkeletonProps {
  hasImage?: boolean;
  lines?: number;
  imageShape?: 'circular' | 'rounded';
}

export const ListItemSkeleton: React.FC<ListItemSkeletonProps> = ({
  hasImage = true,
  lines = 2,
  imageShape = 'rounded',
}) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
      {hasImage && (
        <Skeleton
          variant={imageShape === 'circular' ? 'circular' : 'rounded'}
          width={48}
          height={48}
        />
      )}
      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={i === 0 ? '70%' : '50%'}
            height={i === 0 ? 18 : 14}
          />
        ))}
      </div>
    </div>
  );
};
