import React from 'react';
import { DISTANCE_FILTER_OPTIONS_KM, DistanceFilterOption } from '@part/shared';
import { Compass } from 'lucide-react';

interface Props {
  selectedRadius: number;
  onSelectRadius: (radius: number) => void;
}

export const DistanceFilterBar: React.FC<Props> = ({
  selectedRadius,
  onSelectRadius,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mr-1">
        <Compass className="w-3.5 h-3.5 text-secondary" />
        <span>Radius:</span>
      </div>
      {DISTANCE_FILTER_OPTIONS_KM.map((dist) => (
        <button
          key={dist}
          onClick={() => onSelectRadius(dist)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
            selectedRadius === dist
              ? 'bg-secondary text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {dist} km
        </button>
      ))}
    </div>
  );
};
