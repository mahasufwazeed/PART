import React from 'react';
import { TASK_CATEGORIES, CategoryDef } from '@part/shared';
import { useAppStore } from '../store/useAppStore';
import {
  Package,
  ShoppingCart,
  Home,
  GraduationCap,
  Cpu,
  Calendar,
  Briefcase,
  Sparkles,
} from 'lucide-react';

interface CategoryGridProps {
  selectedCategoryId?: string;
  onSelectCategory?: (id: string | undefined) => void;
  showAllOption?: boolean;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategoryId,
  onSelectCategory,
  showAllOption = true,
}) => {
  const { language } = useAppStore();

  const getCategoryIcon = (iconName: string, accentColor: string) => {
    const props = { className: 'w-6 h-6', style: { color: accentColor } };
    switch (iconName) {
      case 'Package':
        return <Package {...props} />;
      case 'ShoppingCart':
        return <ShoppingCart {...props} />;
      case 'Home':
        return <Home {...props} />;
      case 'GraduationCap':
        return <GraduationCap {...props} />;
      case 'Cpu':
        return <Cpu {...props} />;
      case 'Calendar':
        return <Calendar {...props} />;
      case 'Briefcase':
        return <Briefcase {...props} />;
      case 'Sparkles':
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <div className="space-y-2.5 select-none">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
          {language === 'ta'
            ? 'உங்களுக்கு என்ன உதவி தேவை?'
            : 'What do you need help with?'}
        </h3>
        {selectedCategoryId && onSelectCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(undefined)}
            className="text-[11px] font-bold text-part-green hover:underline cursor-pointer"
          >
            {language === 'ta' ? 'அனைத்தும்' : 'Clear filter'}
          </button>
        )}
      </div>

      {/* 2-Row Horizontal Scrollable Grid */}
      <div className="grid grid-rows-2 grid-flow-col auto-cols-[105px] sm:auto-cols-[125px] gap-2.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        {TASK_CATEGORIES.map((cat: CategoryDef) => {
          const isSelected = selectedCategoryId === cat.id;
          const displayName = language === 'ta' ? cat.name_ta : cat.name_en;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory && onSelectCategory(isSelected ? undefined : cat.id)}
              style={{
                backgroundColor: isSelected ? '#146B3A' : cat.pastelBg,
                borderColor: isSelected ? '#146B3A' : `${cat.accentColor}25`,
              }}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 shadow-quick hover:shadow-card relative overflow-hidden h-[98px]`}
            >
              <div
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110"
              >
                {getCategoryIcon(cat.icon, isSelected ? '#FFFFFF' : cat.accentColor)}
              </div>

              <span
                style={{
                  color: isSelected ? '#FFFFFF' : '#171717',
                }}
                className="text-[11px] sm:text-xs font-heading font-bold leading-tight line-clamp-2 px-0.5"
              >
                {displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
