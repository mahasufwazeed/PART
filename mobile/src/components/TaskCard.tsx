import React from 'react';
import { Task } from '@part/shared';
import { StatusBadge } from './StatusBadge';
import { useAppStore } from '../store/useAppStore';
import { MapPin, Clock, Star, IndianRupee, ChevronRight } from 'lucide-react';

interface Props {
  task: Task;
}

export const TaskCard: React.FC<Props> = ({ task }) => {
  const { openTaskDetails, language } = useAppStore();

  const categoryName =
    language === 'ta' && task.category?.name_ta
      ? task.category.name_ta
      : task.category?.name_en || 'General Task';

  const locality = task.location?.locality || 'Chennai';
  const distance =
    typeof task.distance_km === 'number'
      ? `${task.distance_km} km`
      : 'Nearby';

  return (
    <div
      onClick={() => openTaskDetails(task.id)}
      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-secondary-dark bg-secondary/10 px-2 py-0.5 rounded-md">
          {categoryName}
        </span>
        <StatusBadge status={task.status} />
      </div>

      <h3 className="font-bold text-slate-900 text-sm mb-1.5 line-clamp-1 hover:text-primary transition">
        {task.title}
      </h3>

      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
        {task.description}
      </p>

      {/* Meta tags */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3 border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-1 font-medium text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-secondary" />
          <span>{locality}</span>
          <span className="text-slate-400">•</span>
          <span className="text-accent font-semibold">{distance}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{task.estimated_duration_minutes} mins</span>
        </div>

        {task.requester && (
          <div className="flex items-center gap-1 ml-auto text-amber-600 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{task.requester.rating_as_requester.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Footer & Budget */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Budget
          </span>
          <span className="text-base font-extrabold text-slate-900 flex items-center">
            ₹{task.budget_inr.toLocaleString('en-IN')}
          </span>
        </div>

        <button className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition">
          <span>{language === 'ta' ? 'விவரங்கள்' : 'View'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
