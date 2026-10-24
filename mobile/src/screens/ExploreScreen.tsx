import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { taskService, Task, TASK_CATEGORIES, CHENNAI_LOCALITIES } from '@part/shared';
import { TaskCard } from '../components/TaskCard';
import { RealtimeMap } from '../components/RealtimeMap';
import { SearchBar } from '../components/SearchBar';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
  List,
  Map as MapIcon,
  SlidersHorizontal,
  MapPin,
  ChevronDown,
  Zap,
  Sparkles,
  Calendar,
  Flame,
  ArrowUpDown,
} from 'lucide-react';

export const ExploreScreen: React.FC = () => {
  const { userLocation, setUserLocation, language, setTab } = useAppStore();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<
    'nearby' | 'highest_pay' | 'newest' | 'quick_tasks' | 'today'
  >('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    const results = await taskService.getNearbyTasks({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radiusKm: 25,
      categoryId: selectedCategory,
      searchQuery,
    });

    let filtered = [...results];

    // Quick Tasks filter (< 60 min)
    if (activeFilter === 'quick_tasks') {
      filtered = filtered.filter((t) => t.estimated_duration_minutes <= 60);
    }

    // Today filter
    if (activeFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      filtered = filtered.filter((t) => t.preferred_date === todayStr);
    }

    // Sorting
    if (activeFilter === 'nearby') {
      filtered.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    } else if (activeFilter === 'highest_pay') {
      filtered.sort((a, b) => b.budget_inr - a.budget_inr);
    } else if (activeFilter === 'newest') {
      filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    setTasks(filtered);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [userLocation, selectedCategory, activeFilter, searchQuery]);

  const currentLocalityName = userLocation.locality.split(',')[0].trim();

  return (
    <div className="pb-28 min-h-screen bg-[#F7F8FA] select-none">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200/90 shadow-xs px-4 pt-3 pb-2 space-y-2.5">
        {/* Row 1: Location & List/Map Toggle */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-1.5 text-left group"
          >
            <div className="w-5 h-5 rounded-full bg-part-green-mint text-part-green flex items-center justify-center">
              <MapPin className="w-3 h-3 text-part-green" />
            </div>
            <span className="font-heading font-black text-xs text-neutral-900 group-hover:underline">
              {currentLocalityName}, Chennai
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {/* List vs Map Switcher */}
          <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-part-green text-white shadow-xs font-heading font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'map'
                  ? 'bg-part-green text-white shadow-xs font-heading font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full"
        />

        {/* Row 3: Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          <button
            type="button"
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1 rounded-full text-xs font-heading font-bold whitespace-nowrap transition cursor-pointer ${
              !selectedCategory
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            All Categories
          </button>
          {TASK_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const name = language === 'ta' ? cat.name_ta : cat.name_en;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? undefined : cat.id)}
                style={{
                  backgroundColor: isSelected ? cat.accentColor : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#171717',
                  borderColor: isSelected ? cat.accentColor : '#E5E7EB',
                }}
                className={`px-3 py-1 rounded-full text-xs font-heading font-bold whitespace-nowrap border transition cursor-pointer shadow-xs`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Row 4: Sticky Filter Row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 text-xs">
          {[
            { key: 'nearby', label: '📍 Nearby' },
            { key: 'highest_pay', label: '💰 Highest Pay' },
            { key: 'newest', label: '⚡ Newest' },
            { key: 'quick_tasks', label: '⏱️ Quick (< 1hr)' },
            { key: 'today', label: '📅 Today' },
          ].map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key as any)}
                className={`px-2.5 py-1 rounded-lg font-heading font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-brand-yellow text-neutral-950 shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: List View or Map View */}
      <div className="px-4 pt-3">
        {viewMode === 'map' ? (
          <div className="space-y-3">
            <RealtimeMap
              tasks={tasks}
              centerLat={userLocation.latitude}
              centerLng={userLocation.longitude}
            />
            <p className="text-xs text-neutral-500 text-center font-medium">
              Interactive PostGIS radius map showing verified tasks across Chennai.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {isLoading ? (
              <SkeletonLoader count={4} />
            ) : tasks.length === 0 ? (
              <EmptyState
                title="No tasks found matching filters"
                subtitle="Try clearing your category or filter selection to discover more nearby opportunities."
                actionText="Reset Filters"
                onAction={() => {
                  setSelectedCategory(undefined);
                  setActiveFilter('nearby');
                  setSearchQuery('');
                }}
              />
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>

      {/* Neighborhood Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-heading font-black text-base text-neutral-900">
                Change Discovery Locality
              </h3>
              <button
                type="button"
                onClick={() => setShowLocationPicker(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-neutral-100 py-2 flex-1">
              {CHENNAI_LOCALITIES.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    setUserLocation({
                      locality: `${loc.name}, Chennai`,
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                    });
                    setShowLocationPicker(false);
                  }}
                  className="w-full py-2.5 px-2 text-left flex items-center justify-between text-xs font-semibold text-neutral-800 hover:bg-neutral-50 rounded-lg"
                >
                  <span>{loc.name}, Chennai</span>
                  {currentLocalityName === loc.name && (
                    <span className="text-part-green font-bold">✓ Selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
