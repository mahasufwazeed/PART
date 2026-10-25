import React from 'react';
import { Sparkles, PlusCircle, Compass, RefreshCw, MapPin } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActions?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }[];
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
  title,
  subtitle,
  actionText,
  onAction,
  secondaryActions = [],
  icon,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-quick text-center flex flex-col items-center justify-center space-y-3.5 max-w-sm sm:max-w-md mx-auto select-none col-span-full">
      <div className="w-14 h-14 rounded-2xl bg-brand-yellow/20 text-neutral-900 flex items-center justify-center shadow-xs">
        {icon || <Sparkles className="w-7 h-7 text-part-green" />}
      </div>

      <div className="space-y-1">
        <h4 className="font-heading font-black text-sm sm:text-base text-neutral-900 leading-snug">
          {title}
        </h4>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 bg-part-green hover:bg-part-green-dark text-white font-heading font-bold text-xs rounded-xl shadow-green hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </button>
        )}

        {secondaryActions.map((sec, idx) => (
          <button
            key={idx}
            type="button"
            onClick={sec.onClick}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-heading font-bold text-xs rounded-xl border border-neutral-200 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
          >
            {sec.icon || <RefreshCw className="w-3.5 h-3.5" />}
            <span>{sec.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
