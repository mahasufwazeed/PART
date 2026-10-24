import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  campusService,
  Task,
  CAMPUS_TASK_CATEGORIES,
  CHENNAI_COLLEGES,
} from '@part/shared';
import {
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  Plus,
  ArrowRight,
  Building,
  Presentation,
  Printer,
  Code,
  Calendar,
  Package,
  Users,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { CollegeSelectorModal } from '../components/CollegeSelectorModal';
import { PostCampusTaskModal } from '../components/PostCampusTaskModal';

export const CampusScreen: React.FC = () => {
  const {
    currentProfile,
    selectedCollegeId,
    selectedCollegeName,
    isCollegeSelectorOpen,
    openCollegeSelector,
    closeCollegeSelector,
    isPostCampusTaskOpen,
    openPostCampusTask,
    closePostCampusTask,
    openTaskDetails,
    language,
    setTab,
  } = useAppStore();

  const collegeDef =
    CHENNAI_COLLEGES.find((c) => c.id === selectedCollegeId) ||
    CHENNAI_COLLEGES[0];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'highest_reward'>('latest');
  const [filterScope, setFilterScope] = useState<'my_college' | 'all'>('my_college');

  const loadTasks = async () => {
    setIsLoading(true);
    const result = await campusService.getCampusTasks({
      collegeId: filterScope === 'my_college' ? selectedCollegeId : undefined,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      searchQuery: searchQuery.trim() || undefined,
      sort: sortBy,
      userStatus: currentProfile?.college_status || 'self_selected',
    });
    setTasks(result);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, [selectedCollegeId, selectedCategory, searchQuery, sortBy, filterScope, currentProfile?.college_status]);

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getCategoryIcon = (catId?: string) => {
    switch (catId) {
      case 'ppt_design':
        return <Presentation className="w-3.5 h-3.5 text-amber-600" />;
      case 'notes_printing':
        return <Printer className="w-3.5 h-3.5 text-emerald-600" />;
      case 'tutoring_coding':
        return <Code className="w-3.5 h-3.5 text-blue-600" />;
      case 'event_help':
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />;
      case 'materials_errands':
        return <Package className="w-3.5 h-3.5 text-orange-600" />;
      default:
        return <GraduationCap className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  return (
    <div className="pb-28 min-h-screen bg-[#F7F8FA] select-none">
      {/* 1. TOP CAMPUS BANNER & COLLEGE SWITCHER */}
      <div className="bg-gradient-to-br from-emerald-900 via-part-green-dark to-neutral-900 text-white px-3 sm:px-6 pt-4 pb-4 shadow-md space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shrink-0 shadow-xs">
              {collegeDef?.emoji || '🎓'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-part-green-mint">
                  Campus Community
                </span>
                {currentProfile?.college_status === 'verified' ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded-md">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Verified Student
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-neutral-300 bg-white/10 px-1.5 py-0.2 rounded-md">
                    Self-Selected
                  </span>
                )}
              </div>
              <h2 className="font-heading font-black text-base sm:text-lg text-white leading-tight truncate">
                {selectedCollegeName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="btn-switch-college"
            onClick={openCollegeSelector}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-heading font-bold text-xs rounded-xl border border-white/20 shadow-xs transition cursor-pointer shrink-0"
          >
            Change College
          </button>
        </div>

        {/* Academic Integrity Subtitle Pill */}
        <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3 py-1.5 border border-white/10 flex items-center justify-between text-[11px] text-emerald-100">
          <span className="truncate">
            Peer tutoring, PPTs, printing & errands • No dishonest exam help
          </span>
          <span className="font-bold text-brand-yellow shrink-0 ml-2">
            {tasks.length} Active Gigs
          </span>
        </div>
      </div>

      {/* 2. MAIN CONTENT BODY */}
      <div className="px-3 sm:px-5 md:px-6 pt-3 space-y-3.5">
        {/* POST CAMPUS TASK PROMINENT BANNER (Blinkit Yellow CTA) */}
        <div className="bg-gradient-to-r from-brand-yellow via-amber-300 to-amber-400 text-neutral-950 p-3 sm:p-4 rounded-3xl shadow-card flex items-center justify-between gap-3 border border-amber-300">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
              Need Help on Campus?
            </span>
            <h3 className="font-heading font-black text-sm sm:text-base text-neutral-950 leading-tight truncate">
              Post notes printing, PPT design, or lab doubts
            </h3>
            <p className="text-[11px] text-neutral-800">
              Fellow students from {selectedCollegeName} can accept and help in minutes.
            </p>
          </div>

          <button
            type="button"
            id="btn-post-campus-task"
            onClick={openPostCampusTask}
            className="py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 text-white font-heading font-black text-xs rounded-2xl shadow-md active:scale-95 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand-yellow stroke-[3]" />
            <span>Post Campus Task</span>
          </button>
        </div>

        {/* 3. SEARCH & SCOPE CONTROLS */}
        <div className="space-y-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search campus tasks in ${selectedCollegeName}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200/90 rounded-2xl text-xs font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-part-green shadow-xs transition"
            />
          </div>

          {/* Scope & Sort Filter Row */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 text-xs">
            {/* Scope: My College vs All Colleges */}
            <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setFilterScope('my_college')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] font-heading ${
                  filterScope === 'my_college'
                    ? 'bg-part-green text-white shadow-xs font-black'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {selectedCollegeName.split(' ')[0]} Only
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] font-heading ${
                  filterScope === 'all'
                    ? 'bg-part-green text-white shadow-xs font-black'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All Campuses
              </button>
            </div>

            {/* Sort: Latest vs Highest Reward */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setSortBy('latest')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-heading font-bold transition cursor-pointer ${
                  sortBy === 'latest'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                ⚡ Latest
              </button>
              <button
                type="button"
                onClick={() => setSortBy('highest_reward')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-heading font-bold transition cursor-pointer ${
                  sortBy === 'highest_reward'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                💰 Highest Reward
              </button>
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:-mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-heading font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-part-green text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              All Categories
            </button>
            {CAMPUS_TASK_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-heading font-bold whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'bg-part-green text-white border-part-green shadow-xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                  <span>{cat.name.split('&')[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. TASK FEED */}
        {isLoading ? (
          <SkeletonLoader count={3} />
        ) : tasks.length === 0 ? (
          <EmptyState
            title={`No campus tasks found in ${selectedCollegeName}`}
            subtitle="Be the first student to post notes printing, PPT design, or lab doubt help!"
            actionText="Post Campus Task"
            onAction={openPostCampusTask}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 space-y-0">
            {tasks.map((task) => {
              return (
                <div
                  key={task.id}
                  onClick={() => openTaskDetails(task.id)}
                  className="bg-white rounded-3xl p-3.5 sm:p-4 border border-neutral-200/90 shadow-quick hover:shadow-card hover:border-part-green/40 transition-all cursor-pointer active:scale-[0.99] select-none flex flex-col justify-between group"
                >
                  {/* Top Bar: College & Category Badge + Posted Time */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-part-green bg-part-green-mint px-2 py-0.5 rounded-full truncate">
                          🎓 {task.college_name || selectedCollegeName}
                        </span>
                        {task.visibility === 'EVERYONE_NEARBY' && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">
                            Nearby
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400 shrink-0">
                        {timeAgo(task.created_at)}
                      </span>
                    </div>

                    {/* Task Title */}
                    <h3 className="font-heading font-black text-sm sm:text-base text-neutral-900 group-hover:text-part-green transition leading-snug mb-1">
                      {task.title}
                    </h3>

                    {/* Description preview */}
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-3">
                      {task.description}
                    </p>
                  </div>

                  {/* Metadata Row: Campus Location + Deadline */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 pt-2 border-t border-neutral-100 mb-3">
                      <div className="flex items-center gap-1 font-semibold text-neutral-800">
                        <MapPin className="w-3.5 h-3.5 text-part-green shrink-0" />
                        <span className="truncate max-w-[170px] sm:max-w-[200px]">
                          {task.campus_location || 'Campus Center'}
                        </span>
                      </div>

                      {task.deadline && (
                        <>
                          <span className="text-neutral-300">•</span>
                          <div className="flex items-center gap-1 text-[11px] text-neutral-600">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>{task.deadline}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom Action Row: Reward + Accept Task Button */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[9.5px] text-neutral-400 uppercase font-black tracking-wider block">
                          Reward
                        </span>
                        <span className="text-lg font-heading font-black text-neutral-950 flex items-center">
                          ₹{task.budget_inr}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskDetails(task.id);
                        }}
                        className="py-1.5 sm:py-2 px-3.5 sm:px-4 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-xl shadow-green hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
                      >
                        <span>Accept Task</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Modals */}
      <CollegeSelectorModal
        isOpen={isCollegeSelectorOpen}
        onClose={closeCollegeSelector}
        onCollegeSelected={(c) => {
          loadTasks();
        }}
      />

      <PostCampusTaskModal
        isOpen={isPostCampusTaskOpen}
        onClose={closePostCampusTask}
        onTaskCreated={() => {
          loadTasks();
        }}
      />
    </div>
  );
};
