import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Sparkles, PlusCircle, Compass } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
  title,
  subtitle,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-quick text-center flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto select-none">
      <div className="w-14 h-14 rounded-2xl bg-brand-yellow/20 text-neutral-900 flex items-center justify-center shadow-xs">
        {icon || <Sparkles className="w-7 h-7 text-part-green" />}
      </div>

      <div className="space-y-1">
        <h4 className="font-heading font-black text-sm sm:text-base text-neutral-900 leading-snug">
          {title}
        </h4>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
          {subtitle}
        </p>
      </div>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 py-2.5 bg-part-green hover:bg-part-green-dark text-white font-heading font-bold text-xs rounded-xl shadow-green hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
