import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  taskService,
  locationService,
  Task,
  TASK_CATEGORIES,
  DISTANCE_FILTER_OPTIONS_KM,
} from '@part/shared';
import { TaskCard } from '../components/TaskCard';
import { RealtimeMap } from '../components/RealtimeMap';
import { MapLibreView } from '../components/MapLibreView';
import { LocationSelectorModal } from '../components/LocationSelectorModal';
import { SearchBar } from '../components/SearchBar';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
  List,
  Map as MapIcon,
  MapPin,
  ChevronDown,
  Layers,
  Compass,
} from 'lucide-react';

export const ExploreScreen: React.FC = () => {
  const { userLocation, activeLocation, language, openTaskDetails } = useAppStore();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapEngine, setMapEngine] = useState<'maplibre' | 'leaflet'>('maplibre');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(5);
  const [activeFilter, setActiveFilter] = useState<
    'nearby' | 'highest_pay' | 'newest' | 'quick_tasks' | 'today'
  >('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Request counter to avoid stale response race conditions
  const fetchRequestId = React.useRef(0);

  const currentCoords = activeLocation?.coordinates || {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
  };
  const currentLocalityName = (
    activeLocation?.label || userLocation.locality
  ).split(',')[0].trim();

  const fetchTasks = async () => {
    const requestId = ++fetchRequestId.current;
    setIsLoading(true);

    try {
      // Call PostGIS / Haversine locationService
      const results = await locationService.getNearbyTasks(
        currentCoords.latitude,
        currentCoords.longitude,
        selectedRadiusKm
      );

      if (requestId !== fetchRequestId.current) return;

      let filtered = [...results];

      // Filter by category
      if (selectedCategory) {
        filtered = filtered.filter((t) => t.category_id === selectedCategory);
      }

      // Filter by text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.location?.locality.toLowerCase().includes(q)
        );
      }

      // Quick Tasks filter (< 60 min)
      if (activeFilter === 'quick_tasks') {
        filtered = filtered.filter((t) => (t.estimated_duration_minutes || 0) <= 60);
      }

      // Today filter using local Chennai IST timezone (Asia/Kolkata)
      if (activeFilter === 'today') {
        const todayStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());
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
    } finally {
      if (requestId === fetchRequestId.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTasks();
    const unsubscribe = taskService.subscribeToTasks(() => {
      fetchTasks();
    });
    return () => {
      unsubscribe();
    };
  }, [
    activeLocation,
    userLocation.latitude,
    userLocation.longitude,
    selectedCategory,
    selectedRadiusKm,
    activeFilter,
    searchQuery,
  ]);

  return (
    <div className="pb-28 min-h-screen bg-[#F7F8FA] select-none">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200/90 shadow-xs px-3 sm:px-6 pt-3 pb-2 space-y-2">
        {/* Row 1: Location Bar & View Switcher */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-1.5 text-left group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-part-green-mint text-part-green flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-part-green" />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-black text-xs text-neutral-900 group-hover:underline block truncate">
                {currentLocalityName}, Chennai
              </span>
              <span className="text-[10px] text-neutral-400 block -mt-0.5">
                Within {selectedRadiusKm} km • Tap to change
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          </button>

          {/* List vs Map Switcher */}
          <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
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
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
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

        {/* Row 3: Distance Radius Filter Bar (1, 3, 5, 10 km) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none -mx-4 px-4 text-xs">
          <span className="text-[10px] font-heading font-black text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3 text-part-green" />
            <span>Radius:</span>
          </span>
          {DISTANCE_FILTER_OPTIONS_KM.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setSelectedRadiusKm(km)}
              className={`px-3 py-1 rounded-full text-xs font-heading font-bold whitespace-nowrap transition cursor-pointer ${
                selectedRadiusKm === km
                  ? 'bg-part-green text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>

        {/* Row 4: Category Chips */}
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

        {/* Row 5: Sort Filter Row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 text-xs">
          {[
            { key: 'nearby', label: '📍 Nearest' },
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
      <div className="px-3 sm:px-5 md:px-6 pt-3">
        {viewMode === 'map' ? (
          <div className="space-y-3">
            {/* Engine Switcher */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-heading font-bold text-neutral-600">
                Found {tasks.length} tasks within {selectedRadiusKm}km
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-neutral-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMapEngine('maplibre')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-heading font-black transition ${
                    mapEngine === 'maplibre'
                      ? 'bg-part-green text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  MapLibre GL
                </button>
                <button
                  type="button"
                  onClick={() => setMapEngine('leaflet')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-heading font-black transition ${
                    mapEngine === 'leaflet'
                      ? 'bg-part-green text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Geoapify Tile
                </button>
              </div>
            </div>

            {/* Selected Map Engine */}
            {mapEngine === 'maplibre' ? (
              <MapLibreView
                tasks={tasks}
                centerLat={currentCoords.latitude}
                centerLng={currentCoords.longitude}
                radiusKm={selectedRadiusKm}
                onRadiusChange={(km) => setSelectedRadiusKm(km)}
                onTaskSelect={(task) => openTaskDetails(task.id)}
              />
            ) : (
              <RealtimeMap
                tasks={tasks}
                centerLat={currentCoords.latitude}
                centerLng={currentCoords.longitude}
                initialRadiusKm={selectedRadiusKm}
                onRadiusChange={(km) => setSelectedRadiusKm(km)}
              />
            )}

            <p className="text-xs text-neutral-500 text-center font-medium">
              Interactive PostGIS radius map showing verified tasks in Chennai with live price tags.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 space-y-0">
            {isLoading ? (
              <SkeletonLoader count={4} />
            ) : tasks.length === 0 ? (
              <EmptyState
                title="No nearby tasks found"
                subtitle="Try increasing your search radius or selecting another location."
                actionText="Increase Radius"
                onAction={() => {
                  const nextKm =
                    selectedRadiusKm < 25
                      ? DISTANCE_FILTER_OPTIONS_KM.find((km) => km > selectedRadiusKm) || 25
                      : 25;
                  setSelectedRadiusKm(nextKm);
                }}
                secondaryActions={[
                  {
                    label: 'Change Location',
                    onClick: () => setShowLocationPicker(true),
                  },
                  {
                    label: 'Refresh Tasks',
                    onClick: () => fetchTasks(),
                  },
                ]}
              />
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>

      {/* Full Blinkit-style Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />
    </div>
  );
};
