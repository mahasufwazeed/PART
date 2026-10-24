import React from 'react';
import { Task } from '@part/shared';
import { useAppStore } from '../store/useAppStore';
import { TaskCard } from './TaskCard';
import { Zap, ArrowRight, PlusCircle } from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const FastTasksSection: React.FC<Props> = ({ tasks }) => {
  const { setTab, language } = useAppStore();

  const fastTasks = tasks.filter(
    (t) => t.estimated_duration_minutes <= 60 && t.status === 'OPEN'
  );

  return (
    <div className="space-y-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-black text-base text-neutral-900 flex items-center gap-1.5 tracking-tight">
            <span>⚡ {language === 'ta' ? 'விரைவுப் பணிகள்' : 'Quick Tasks'}</span>
          </h3>
          <p className="text-[11px] font-medium text-neutral-500">
            {language === 'ta'
              ? 'ஒரு மணி நேரத்திற்குள் முடிக்கக்கூடிய அருகிலுள்ள பணிகள்'
              : 'Nearby jobs that take less than an hour'}
          </p>
        </div>

        {fastTasks.length > 0 && (
          <button
            type="button"
            onClick={() => setTab('explore')}
            className="text-xs font-heading font-bold text-part-green hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>{language === 'ta' ? 'அனைத்தும்' : 'See all'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Carousel */}
      {fastTasks.length === 0 ? (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-quick">
          <div className="space-y-0.5">
            <h4 className="font-heading font-black text-xs text-neutral-900">
              {language === 'ta'
                ? 'அவசர உதவி தேவையா?'
                : 'Need something quick done?'}
            </h4>
            <p className="text-[11px] text-neutral-600">
              {language === 'ta'
                ? 'மருந்து, மளிகை அல்லது சிறு உதவிகளை உடனே பதிவு செய்க.'
                : 'Post a 15-30 min pickup or errand for someone nearby.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTab('post')}
            className="px-3 py-2 bg-part-green hover:bg-part-green-dark text-white font-heading font-bold text-xs rounded-xl shadow-green shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'பதிவு' : 'Post Quick'}</span>
          </button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          {fastTasks.map((t) => (
            <TaskCard key={t.id} task={t} compact={true} />
          ))}
        </div>
      )}
    </div>
  );
};
