import React, { useState, useEffect, useRef } from 'react';
import PartLeafletMap from './map/PartLeafletMap';
import { useAppStore } from '../store/useAppStore';
import {
  locationService,
  taskService,
  Task,
  DISTANCE_FILTER_OPTIONS_KM,
} from '@part/shared';
import { MapPin, Compass, AlertCircle, Loader2 } from 'lucide-react';

export interface NearbyTasksProps {
  className?: string;
  onTaskSelect?: (task: Task) => void;
  showTitle?: boolean;
}

/**
 * NearbyTasks component for PART
 * Implements Step 3 of the Leaflet + OpenStreetMap integration:
 * - Dynamic radius controls [1, 3, 5, 10, 15, 25] km
 * - Live connection to PART's active location state
 * - Automatic task fetching within the chosen radius
 * - Distinction between device physical GPS and chosen search center
 */
export default function NearbyTasks({
  className = '',
  onTaskSelect,
  showTitle = true,
}: NearbyTasksProps) {
  const { userLocation, activeLocation, openTaskDetails } = useAppStore();
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRequestId = useRef(0);

  // Active search center from PART global state
  const centerCoords = activeLocation?.coordinates || {
    latitude: userLocation.latitude || 12.9815,
    longitude: userLocation.longitude || 80.218,
  };

  const localityName = (
    activeLocation?.label || userLocation.locality || 'Chennai'
  ).split(',')[0].trim();

  // Physical GPS coordinates (distinct from search center)
  const userGpsCoords =
    userLocation.latitude && userLocation.longitude
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : null;

  useEffect(() => {
    let isMounted = true;
    const reqId = ++fetchRequestId.current;

    async function loadTasks() {
      setIsLoading(true);
      try {
        const results = await locationService.getNearbyTasks(
          centerCoords.latitude,
          centerCoords.longitude,
          radiusKm
        );

        if (isMounted && reqId === fetchRequestId.current) {
          setTasks(results || []);
          const dbErr = locationService.getLastQueryError();
          setFetchError(dbErr);
        }
      } catch (err: any) {
        if (isMounted && reqId === fetchRequestId.current) {
          setFetchError(err?.message || 'Failed to load nearby tasks');
        }
      } finally {
        if (isMounted && reqId === fetchRequestId.current) {
          setIsLoading(false);
        }
      }
    }

    loadTasks();

    const unsubscribe = taskService.subscribeToTasks(() => {
      loadTasks();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [centerCoords.latitude, centerCoords.longitude, radiusKm]);

  const handleTaskClick = (task: Task) => {
    if (onTaskSelect) {
      onTaskSelect(task);
    } else {
      openTaskDetails(task.id);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 px-1">
          <div>
            <h2 className="text-lg font-heading font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-part-green animate-pulse" />
              Explore Nearby Tasks
            </h2>
            <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-part-green shrink-0" />
              <span>
                Searching around <strong className="text-neutral-800">{localityName}</strong>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-heading font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-xl">
              {isLoading ? (
                <span className="flex items-center gap-1 text-neutral-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              ) : (
                `${tasks.length} tasks within ${radiusKm}km`
              )}
            </span>
          </div>
        </div>
      )}

      {/* Radius Selector Pills: [1, 3, 5, 10, 15, 25] km */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[10px] font-heading font-black text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Compass className="w-3 h-3 text-part-green" />
          <span>Radius:</span>
        </span>
        {DISTANCE_FILTER_OPTIONS_KM.map((km) => {
          const isSelected = radiusKm === km;
          return (
            <button
              key={km}
              type="button"
              onClick={() => setRadiusKm(km)}
              className={`px-3 py-1.5 rounded-full text-xs font-heading font-bold whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-part-green text-white shadow-xs scale-102'
                  : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50'
              }`}
            >
              {km} km
            </button>
          );
        })}
      </div>

      {/* Fallback Notice Banner */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200/90 text-amber-800 px-3 py-2 rounded-2xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              locationService.clearLastQueryError();
              setFetchError(null);
            }}
            className="text-[10px] font-bold underline shrink-0 ml-2 hover:text-amber-950 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Core Leaflet + OpenStreetMap Component */}
      <PartLeafletMap
        latitude={centerCoords.latitude}
        longitude={centerCoords.longitude}
        radiusKm={radiusKm}
        tasks={tasks}
        onTaskSelect={handleTaskClick}
        onRadiusChange={(km) => setRadiusKm(km)}
        userGpsCoords={userGpsCoords}
      />
    </div>
  );
}

export { NearbyTasks };
