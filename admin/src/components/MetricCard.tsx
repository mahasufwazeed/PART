import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  variant?: 'primary' | 'accent' | 'secondary' | 'warning' | 'danger';
}

export const MetricCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = 'primary',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'accent':
        return 'text-accent bg-accent/10 border-accent/20';
      case 'secondary':
        return 'text-secondary bg-secondary/10 border-secondary/20';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'danger':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${getVariantStyles()}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
      )}
    </div>
  );
};
