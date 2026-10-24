import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { taskService } from '@part/shared';
import { Task } from '@part/shared';
import { Header } from '../components/Header';
import { CategoryGrid } from '../components/CategoryGrid';
import { TaskCard } from '../components/TaskCard';
import {
  PlusCircle,
  Briefcase,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { setTab, userLocation, language, currentProfile } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    setIsLoading(true);
    const nearby = await taskService.getNearbyTasks({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radiusKm: 20,
      categoryId: selectedCategory,
      searchQuery,
    });
    setTasks(nearby);

    // Fetch active user tasks
    const posted = await taskService.getMyPostedTasks(currentProfile.id);
    const assigned = await taskService.getMyAssignedTasks(currentProfile.id);
    const allUserActive = [...posted, ...assigned].filter(
      (t, idx, arr) =>
        arr.findIndex((item) => item.id === t.id) === idx &&
        ['ASSIGNED', 'IN_PROGRESS', 'COMPLETION_SUBMITTED'].includes(t.status)
    );
    setActiveTasks(allUserActive);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [userLocation, selectedCategory, searchQuery, currentProfile.id]);

  return (
    <div className="pb-24">
      {/* Top Header */}
      <Header searchValue={searchQuery} onSearchChange={setSearchQuery} />

      <div className="px-4 pt-4 space-y-5">
        {/* Primary Action Hero Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => setTab('post')}
            className="bg-gradient-to-br from-primary to-indigo-700 text-white p-4 rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition-transform active:scale-[0.98] flex flex-col justify-between h-36"
          >
            <div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-extrabold text-sm leading-tight">
                {language === 'ta' ? 'பணி பதிவு செய்க' : 'Post a Task'}
              </h3>
              <p className="text-[11px] text-indigo-100/80 mt-1">
                {language === 'ta' ? 'உடனடி உதவி பெறுங்கள்.' : 'Need help? Find someone nearby.'}
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-accent">
              <span>{language === 'ta' ? 'தொடங்கு' : 'Post Task'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => setTab('explore')}
            className="bg-gradient-to-br from-secondary to-blue-700 text-white p-4 rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition-transform active:scale-[0.98] flex flex-col justify-between h-36"
          >
            <div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-extrabold text-sm leading-tight">
                {language === 'ta' ? 'பணி தேடுக' : 'Find Work'}
              </h3>
              <p className="text-[11px] text-blue-100/80 mt-1">
                {language === 'ta' ? 'உதவி செய்து வருமானம் ஈட்டவும்.' : 'Earn money by helping people.'}
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-300">
              <span>{language === 'ta' ? 'ஆராய்க' : 'Explore Tasks'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>

        {/* Active Tasks in Progress (if any) */}
        {activeTasks.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                {language === 'ta' ? 'உங்கள் செயலில் உள்ள பணிகள்' : 'Your Active Tasks'} ({activeTasks.length})
              </span>
              <button
                onClick={() => setTab('activity')}
                className="text-xs text-primary font-bold hover:underline"
              >
                {language === 'ta' ? 'அனைத்தும்' : 'View all'}
              </button>
            </div>

            <div className="space-y-2">
              {activeTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        )}

        {/* Popular Categories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'ta' ? 'பிரபலமான பிரிவுகள்' : 'Popular Categories'}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Chennai
            </span>
          </div>
          <CategoryGrid
            selectedCategoryId={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Tasks Near You Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'ta' ? 'உங்களுக்கு அருகில் உள்ள பணிகள்' : 'Tasks Near You'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {userLocation.locality} • {tasks.length} {language === 'ta' ? 'கிடைக்கின்றன' : 'available'}
              </p>
            </div>

            <button
              onClick={() => setTab('explore')}
              className="text-xs font-bold text-primary hover:underline flex items-center"
            >
              <span>{language === 'ta' ? 'வரைபடத்தில் பார்க்க' : 'Map view'}</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-slate-200/60 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-xs text-slate-500 font-medium">
                {language === 'ta'
                  ? 'இந்த பகுதியில் தற்போது புதிய பணிகள் இல்லை. நீங்கள் ஒரு பணியை பதிவு செய்யலாம்!'
                  : 'No open tasks found in this radius right now. Post one or expand your search!'}
              </p>
              <button
                onClick={() => setTab('post')}
                className="mt-3 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
              >
                {language === 'ta' ? 'பணி பதிவு செய்' : 'Post a Task Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Safety Tips Card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 text-accent">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900">
              {language === 'ta' ? 'பாதுகாப்பு குறிப்புகள் (சென்னை)' : 'PART Community Trust & Safety'}
            </h4>
            <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
              {language === 'ta'
                ? 'பொது இடங்களில் சந்திக்கவும். பணி நிறைவடைந்த பின்னரே பணம் செலுத்தவும்.'
                : 'Meet in well-lit public spots. Only confirm payment upon genuine task completion. Never share bank OTPs or passcodes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
