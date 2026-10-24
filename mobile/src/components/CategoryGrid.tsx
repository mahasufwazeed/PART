import React from 'react';
import { TASK_CATEGORIES } from '@part/shared';
import { useAppStore } from '../store/useAppStore';
import {
  Package,
  Home,
  GraduationCap,
  Cpu,
  Calendar,
  Briefcase,
  MoreHorizontal,
} from 'lucide-react';

interface Props {
  selectedCategoryId?: string;
  onSelectCategory?: (id?: string) => void;
}

export const CategoryGrid: React.FC<Props> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { language } = useAppStore();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package':
        return Package;
      case 'Home':
        return Home;
      case 'GraduationCap':
        return GraduationCap;
      case 'Cpu':
        return Cpu;
      case 'Calendar':
        return Calendar;
      case 'Briefcase':
        return Briefcase;
      default:
        return MoreHorizontal;
    }
  };

  return (
    <div className="overflow-x-auto pb-2 scrollbar-none">
      <div className="flex gap-2 min-w-max">
        <button
          onClick={() => onSelectCategory?.(undefined)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
            !selectedCategoryId
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>{language === 'ta' ? 'அனைத்தும்' : 'All Tasks'}</span>
        </button>

        {TASK_CATEGORIES.map((cat) => {
          const Icon = getIcon(cat.icon);
          const isSelected = selectedCategoryId === cat.id;
          const name = language === 'ta' ? cat.name_ta : cat.name_en;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory?.(isSelected ? undefined : cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                isSelected
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
