import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { taskService, Task } from '@part/shared';
import { PARTHeader } from '../components/PARTHeader';
import { SearchBar } from '../components/SearchBar';
import { HeroBanner } from '../components/HeroBanner';
import { QuickActionCard } from '../components/QuickActionCard';
import { CategoryGrid } from '../components/CategoryGrid';
import { FastTasksSection } from '../components/FastTasksSection';
import { TaskCard } from '../components/TaskCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { RealtimeMap } from '../components/RealtimeMap';
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Clock,
  Compass,
  MapPin,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { setTab, userLocation, language, currentProfile, openTaskDetails, selectedCollegeName } =
    useAppStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showHomeMap, setShowHomeMap] = useState(false);

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
    if (currentProfile?.id) {
      const posted = await taskService.getMyPostedTasks(currentProfile.id);
      const assigned = await taskService.getMyAssignedTasks(currentProfile.id);
      const allUserActive = [...posted, ...assigned].filter(
        (t, idx, arr) =>
          arr.findIndex((item) => item.id === t.id) === idx &&
          ['ASSIGNED', 'IN_PROGRESS', 'COMPLETION_SUBMITTED'].includes(t.status)
      );
      setActiveTasks(allUserActive);
    } else {
      setActiveTasks([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [userLocation, selectedCategory, searchQuery, currentProfile?.id]);

  return (
    <div className="pb-28 min-h-screen bg-[#F7F8FA] select-none">
      {/* 1. TOP HEADER (Brand Yellow, Logo, Location, Profile) */}
      <PARTHeader />

      {/* Sticky White Search Bar container right below Header */}
      <div className="bg-brand-yellow px-4 pb-3.5 pt-0 shadow-xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={() => setTab('explore')}
        />
      </div>

      <div className="px-3 sm:px-5 md:px-6 pt-3 sm:pt-4 space-y-4 sm:space-y-5">
        {/* Active Ongoing Task Reminder (if any active gig) */}
        {activeTasks.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-part-green text-white p-3.5 rounded-2xl shadow-green flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-white animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 block">
                  Active Ongoing Task
                </span>
                <h4 className="font-heading font-black text-xs leading-tight line-clamp-1">
                  {activeTasks[0].title}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openTaskDetails(activeTasks[0].id)}
              className="px-3 py-1 bg-white text-part-green text-xs font-heading font-black rounded-lg shadow-xs hover:bg-neutral-100 shrink-0 cursor-pointer"
            >
              Open
            </button>
          </div>
        )}

        {/* 2. HERO SECTION (Banner with illustration & Dual CTAs) */}
        <HeroBanner />

        {/* 3. QUICK ACTIONS (Two prominent tiles: I NEED HELP vs I WANT TO EARN) */}
        <QuickActionCard />

        {/* 3B. CAMPUS COMMUNITY HIGHLIGHT BANNER */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTab('campus')}
          className="bg-gradient-to-r from-emerald-800 to-part-green text-white p-3.5 sm:p-4 rounded-3xl shadow-green flex items-center justify-between cursor-pointer hover:shadow-lg transition-transform active:scale-[0.99] border border-emerald-600/40 select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
              🎓
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-part-green-mint">
                  Campus Community
                </span>
                <span className="text-[9px] font-bold text-emerald-100 bg-white/15 px-1.5 py-0.2 rounded-md truncate">
                  {selectedCollegeName}
                </span>
              </div>
              <h4 className="font-heading font-black text-xs sm:text-sm text-white truncate">
                Need PPT help, notes printed, or lab doubts cleared?
              </h4>
              <p className="text-[11px] text-emerald-100/90 truncate">
                Connect with college peers at {selectedCollegeName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-heading font-bold text-brand-yellow shrink-0 ml-2">
            <span className="hidden sm:inline">Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 4. CATEGORIES (2-row horizontal grid with pastel backgrounds) */}
        <CategoryGrid
          selectedCategoryId={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
        />

        {/* 5. FAST TASKS (⚡ Quick Tasks taking under an hour) */}
        <FastTasksSection tasks={tasks} />

        {/* 6. NEARBY TASKS ("Tasks Around You" + "See All") */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
                {language === 'ta' ? 'அருகிலுள்ள பணிகள்' : 'Tasks Around You'}
              </h3>
              <p className="text-[11px] font-medium text-neutral-500">
                {language === 'ta'
                  ? `${userLocation.locality.split(',')[0]} சுற்றளவில் கிடைக்கும் வாய்ப்புகள்`
                  : `Opportunities around ${userLocation.locality.split(',')[0]}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHomeMap(!showHomeMap)}
                className={`text-xs font-heading font-bold px-2.5 py-1 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                  showHomeMap
                    ? 'bg-part-green text-white border-part-green shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <MapPin className="w-3 h-3 text-part-green" />
                <span>{showHomeMap ? 'Hide Map' : 'Live Map'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('explore')}
                className="text-xs font-heading font-bold text-part-green hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{language === 'ta' ? 'அனைத்தும் காண்க' : 'See All'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Realtime Map on Home Screen */}
          {showHomeMap && (
            <div className="animate-slide-up">
              <RealtimeMap tasks={tasks} />
            </div>
          )}

          {/* Task Feed */}
          {isLoading ? (
            <SkeletonLoader count={3} />
          ) : tasks.length === 0 ? (
            <EmptyState
              title={
                language === 'ta'
                  ? 'தற்போது பணிகள் எதுவும் இல்லை'
                  : 'No tasks nearby right now'
              }
              subtitle={
                language === 'ta'
                  ? 'உங்கள் அண்டை பகுதியில் முதல் பணியை பதிவு செய்து உதவுங்கள்!'
                  : 'Be the first to post a task in your neighborhood and get help in minutes.'
              }
              actionText={language === 'ta' ? 'பணி பதிவு செய்க' : 'Post a Task'}
              onAction={() => setTab('post')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 space-y-0">
              {tasks.slice(0, 6).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Safety & Trust Footer Pill */}
        <div className="bg-white rounded-2xl p-3 border border-neutral-200/80 shadow-quick flex items-center gap-3 text-xs text-neutral-600">
          <div className="w-8 h-8 rounded-xl bg-part-green-mint text-part-green flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-heading font-bold text-neutral-900 block leading-tight">
              {language === 'ta' ? '100% பாதுகாப்பான பரிவர்த்தனை' : '100% Safe & Neighborhood Verified'}
            </span>
            <span className="text-[11px] text-neutral-500">
              {language === 'ta'
                ? 'நேரடி கட்டணம் & சரியான நேரத்தில் உதவி.'
                : 'Cash on completion or direct escrow. Exact addresses shared only after worker assignment.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
