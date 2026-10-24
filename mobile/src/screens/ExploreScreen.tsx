import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { taskService } from '@part/shared';
import { Task } from '@part/shared';
import { TaskCard } from '../components/TaskCard';
import { MapViewSimulation } from '../components/MapViewSimulation';
import { DistanceFilterBar } from '../components/DistanceFilterBar';
import { CategoryGrid } from '../components/CategoryGrid';
import {
  List,
  Map as MapIcon,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
} from 'lucide-react';

export const ExploreScreen: React.FC = () => {
  const { userLocation, language } = useAppStore();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'distance' | 'budget_high' | 'newest'>('distance');
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    setIsLoading(true);
    const results = await taskService.getNearbyTasks({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radiusKm,
      categoryId: selectedCategory,
      searchQuery,
    });

    let sorted = [...results];
    if (sortBy === 'distance') {
      sorted.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    } else if (sortBy === 'budget_high') {
      sorted.sort((a, b) => b.budget_inr - a.budget_inr);
    } else {
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    setTasks(sorted);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [userLocation, radiusKm, selectedCategory, sortBy, searchQuery]);

  return (
    <div className="pb-24 px-4 pt-3 space-y-4">
      {/* Top Search & View Switcher */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              language === 'ta' ? 'பணிகளைத் தேடுக...' : 'Search tasks in Chennai...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'list'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-slate-500'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'map'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-slate-500'
            }`}
            title="Map View"
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Distance Filters */}
      <DistanceFilterBar
        selectedRadius={radiusKm}
        onSelectRadius={(r) => setRadiusKm(r)}
      />

      {/* Category Pills */}
      <CategoryGrid
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Sort Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/80 pb-2">
        <span className="font-semibold text-slate-700">
          {tasks.length} {language === 'ta' ? 'பணிகள் காணப்படுகின்றன' : 'tasks within'} {radiusKm} km
        </span>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent font-bold text-primary focus:outline-none text-xs"
          >
            <option value="distance">
              {language === 'ta' ? 'அருகில் உள்ளவை' : 'Nearest First'}
            </option>
            <option value="budget_high">
              {language === 'ta' ? 'அதிக பட்ஜெட்' : 'Highest Payment'}
            </option>
            <option value="newest">
              {language === 'ta' ? 'புதிய பணிகள்' : 'Newest First'}
            </option>
          </select>
        </div>
      </div>

      {/* View Content: List vs Map */}
      {viewMode === 'map' ? (
        <div className="space-y-3">
          <MapViewSimulation tasks={tasks} />
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700">
              {language === 'ta' ? 'வரைபட பட்டியல்' : 'Tasks in View'}
            </h4>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-xs text-slate-500 font-medium">
                {language === 'ta'
                  ? 'தேர்ந்தெடுக்கப்பட்ட தொலைவில் பணிகள் இல்லை. தேடல் தொலைவை அதிகரிக்கவும்.'
                  : 'No tasks found within this distance. Try increasing your radius filter!'}
              </p>
              <button
                onClick={() => setRadiusKm(20)}
                className="mt-3 bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow"
              >
                Expand to 20 km
              </button>
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      )}
    </div>
  );
};
