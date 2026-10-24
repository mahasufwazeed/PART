import React from 'react';

interface Props {
  count?: number;
  type?: 'card' | 'compact' | 'category';
}

export const SkeletonLoader: React.FC<Props> = ({ count = 3, type = 'card' }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl p-4 border border-neutral-200/60 shadow-quick animate-pulse space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="h-5 w-24 bg-neutral-200 rounded-full" />
            <div className="h-4 w-12 bg-neutral-100 rounded" />
          </div>
          <div className="h-5 w-3/4 bg-neutral-200 rounded-lg" />
          <div className="h-3.5 w-full bg-neutral-100 rounded" />
          <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
            <div className="h-6 w-16 bg-neutral-200 rounded" />
            <div className="h-8 w-24 bg-neutral-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
