import React from 'react';
import { Task, TASK_CATEGORIES } from '@part/shared';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from './StatusBadge';
import {
  MapPin,
  Clock,
  Star,
  ChevronRight,
  Package,
  ShoppingCart,
  Home,
  GraduationCap,
  Cpu,
  Calendar,
  Briefcase,
  Sparkles,
  Zap,
} from 'lucide-react';

interface Props {
  task: Task;
  compact?: boolean;
}

export const TaskCard: React.FC<Props> = ({ task, compact = false }) => {
  const { openTaskDetails, language } = useAppStore();

  const categoryDef = TASK_CATEGORIES.find((c) => c.id === task.category_id);
  const categoryName =
    language === 'ta' && categoryDef?.name_ta
      ? categoryDef.name_ta
      : categoryDef?.name_en || task.category?.name_en || 'Task';

  const locality = task.location?.locality?.split(',')[0] || 'Chennai';
  const distance =
    typeof task.distance_km === 'number'
      ? `${task.distance_km} km away`
      : 'Nearby';

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getCategoryIcon = (iconName?: string) => {
    const props = { className: 'w-4 h-4' };
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
      default:
        return <Sparkles {...props} />;
    }
  };

  if (compact) {
    return (
      <div
        onClick={() => openTaskDetails(task.id)}
        className="bg-white rounded-3xl p-3.5 border border-neutral-200/90 shadow-quick hover:shadow-card transition-all cursor-pointer active:scale-[0.98] w-[210px] sm:w-[230px] shrink-0 flex flex-col justify-between h-[210px] select-none relative overflow-hidden group"
      >
        {/* Top Tag & Time */}
        <div>
          <div className="flex items-center justify-between gap-1 mb-2">
            <div
              style={{
                backgroundColor: categoryDef?.pastelBg || '#FFF7ED',
                color: categoryDef?.accentColor || '#EA580C',
              }}
              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            >
              {getCategoryIcon(categoryDef?.icon)}
              <span className="truncate max-w-[90px]">{categoryName}</span>
            </div>
            <span className="text-[10px] font-semibold text-neutral-400">
              {timeAgo(task.created_at)}
            </span>
          </div>

          <h4 className="font-heading font-black text-xs text-neutral-900 line-clamp-2 leading-tight group-hover:text-part-green transition">
            {task.title}
          </h4>

          <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 mt-1.5">
            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
            <span className="truncate">{locality}</span>
            <span className="text-neutral-300">•</span>
            <span className="text-part-green font-bold shrink-0">{distance}</span>
          </div>
        </div>

        {/* Bottom Reward & Button */}
        <div className="border-t border-neutral-100 pt-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-semibold">
              <Clock className="w-2.5 h-2.5" />
              <span>{task.estimated_duration_minutes} min</span>
            </div>
            <span className="font-heading font-black text-base text-neutral-950">
              ₹{task.budget_inr}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openTaskDetails(task.id);
            }}
            className="px-3 py-1.5 bg-part-green hover:bg-part-green-dark text-white font-heading font-bold text-xs rounded-xl shadow-green hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            {language === 'ta' ? 'பார்' : 'View'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => openTaskDetails(task.id)}
      className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-quick hover:shadow-card hover:border-part-green/40 transition-all cursor-pointer active:scale-[0.99] select-none relative overflow-hidden group"
    >
      {/* Top Category Badge & Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          style={{
            backgroundColor: categoryDef?.pastelBg || '#FFF7ED',
            color: categoryDef?.accentColor || '#EA580C',
          }}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
        >
          {getCategoryIcon(categoryDef?.icon)}
          <span>{categoryName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-neutral-400">
            {timeAgo(task.created_at)}
          </span>
          <StatusBadge status={task.status} />
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="font-heading font-black text-neutral-900 text-sm sm:text-base leading-snug mb-1 group-hover:text-part-green transition">
        {task.title}
      </h3>

      <p className="text-xs text-neutral-600 line-clamp-2 mb-3 leading-relaxed">
        {task.description}
      </p>

      {/* Meta tags: Location, Distance, Duration, Rating */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-500 mb-3 border-t border-neutral-100 pt-2.5">
        <div className="flex items-center gap-1 font-semibold text-neutral-800">
          <MapPin className="w-3.5 h-3.5 text-part-green" />
          <span>{locality}</span>
        </div>

        <span className="text-neutral-300">•</span>

        <span className="text-part-green font-bold bg-part-green-mint px-2 py-0.5 rounded-full text-[11px]">
          {distance}
        </span>

        <span className="text-neutral-300">•</span>

        <div className="flex items-center gap-1 font-medium text-neutral-600">
          <Clock className="w-3 h-3 text-neutral-400" />
          <span>{task.estimated_duration_minutes} min</span>
        </div>

        {task.requester && (
          <div className="flex items-center gap-1 ml-auto text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
            <span>{task.requester.rating_as_requester.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Footer: Prominent Reward & Quick Commerce "View Task" CTA */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider block">
            Task Reward
          </span>
          <span className="text-lg font-heading font-black text-neutral-950 flex items-center">
            ₹{task.budget_inr.toLocaleString('en-IN')}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openTaskDetails(task.id);
          }}
          className="flex items-center gap-1.5 text-xs font-heading font-black text-white bg-part-green hover:bg-part-green-dark px-4 py-2 rounded-xl shadow-green hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <span>{language === 'ta' ? 'பணி காண்க' : 'View Task'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
