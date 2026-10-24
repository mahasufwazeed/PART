import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  locationService,
  geoapifyService,
  WorkerLiveLocation,
  RouteInfo,
  TaskStatus,
} from '@part/shared';
import { MapLibreView } from './MapLibreView';
import {
  Navigation,
  Compass,
  Clock,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  CheckCircle2,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface LiveTrackingSheetProps {
  taskId: string;
  isWorker: boolean;
  taskStatus: TaskStatus;
  taskLocation: {
    latitude: number;
    longitude: number;
    locality: string;
    address_exact?: string | null;
  };
  taskTitle: string;
}

export const LiveTrackingSheet: React.FC<LiveTrackingSheetProps> = ({
  taskId,
  isWorker,
  taskStatus,
  taskLocation,
  taskTitle,
}) => {
  const { currentProfile } = useAppStore();

  const [hasConsent, setHasConsent] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [workerLocation, setWorkerLocation] = useState<WorkerLiveLocation | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastDispatchedCoordsRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  const isTaskActive = taskStatus === 'ASSIGNED' || taskStatus === 'IN_PROGRESS';

  // Calculate Route whenever worker coordinates change
  const updateRoute = useCallback(
    async (workerLat: number, workerLng: number) => {
      try {
        const route = await geoapifyService.calculateRoute(
          { lat: workerLat, lng: workerLng },
          { lat: taskLocation.latitude, lng: taskLocation.longitude },
          'motorcycle'
        );
        setRouteInfo(route);
      } catch (err) {
        console.warn('Could not calculate route:', err);
      }
    },
    [taskLocation.latitude, taskLocation.longitude]
  );

  // Stop tracking automatically if task is completed or cancelled
  useEffect(() => {
    if (!isTaskActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTrackingActive(false);
      setHasConsent(false);
    }
  }, [isTaskActive]);

  // Worker flow: Watch position and broadcast updates
  useEffect(() => {
    if (!isWorker || !isTaskActive || !hasConsent) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTrackingActive(false);
      return;
    }

    if (!navigator.geolocation) {
      setTrackingError('Geolocation is not supported on this device.');
      return;
    }

    setIsTrackingActive(true);
    setTrackingError(null);

    const onPositionUpdate = async (pos: GeolocationPosition) => {
      const { latitude, longitude, heading, speed, accuracy } = pos.coords;
      const now = Date.now();

      // Battery & network optimization: throttle updates to minimum 5m move or 8s interval
      if (lastDispatchedCoordsRef.current) {
        const distKm = geoapifyService.getApiKey()
          ? Math.hypot(
              latitude - lastDispatchedCoordsRef.current.lat,
              longitude - lastDispatchedCoordsRef.current.lng
            ) * 111
          : 0;
        const timeDiff = now - lastDispatchedCoordsRef.current.time;
        if (distKm < 0.005 && timeDiff < 8000) {
          return;
        }
      }

      lastDispatchedCoordsRef.current = { lat: latitude, lng: longitude, time: now };

      const locUpdate: WorkerLiveLocation = {
        task_id: taskId,
        worker_id: currentProfile?.id || 'worker',
        latitude,
        longitude,
        heading: heading ?? null,
        speed: speed ?? null,
        accuracy: accuracy ?? null,
        updated_at: new Date().toISOString(),
      };

      setWorkerLocation(locUpdate);
      setLastUpdatedTime(new Date().toLocaleTimeString());

      // Send to Supabase Realtime channel & Postgres
      if (currentProfile?.id) {
        await locationService.updateWorkerLocation(
          taskId,
          currentProfile.id,
          locUpdate
        );
      }

      // Recalculate route navigation
      updateRoute(latitude, longitude);
    };

    const onPositionError = (err: GeolocationPositionError) => {
      setTrackingError(`GPS error: ${err.message}`);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onPositionUpdate,
      onPositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTrackingActive(false);
    };
  }, [isWorker, isTaskActive, hasConsent, taskId, currentProfile?.id, updateRoute]);

  // Requester & Worker flow: Subscribe to Realtime tracking updates
  useEffect(() => {
    if (!isTaskActive) return;

    // Fetch initial location
    locationService.getWorkerLocation(taskId).then((loc) => {
      if (loc) {
        setWorkerLocation(loc);
        setLastUpdatedTime(new Date(loc.updated_at).toLocaleTimeString());
        updateRoute(loc.latitude, loc.longitude);
      }
    });

    // Subscribe to live broadcast & postgres changes
    const unsubscribe = locationService.subscribeWorkerLocation(taskId, (loc) => {
      setWorkerLocation(loc);
      setLastUpdatedTime(new Date(loc.updated_at).toLocaleTimeString());
      updateRoute(loc.latitude, loc.longitude);
    });

    return () => {
      unsubscribe();
    };
  }, [taskId, isTaskActive, updateRoute]);

  if (!isTaskActive) {
    return (
      <div className="p-3 bg-neutral-100 rounded-2xl text-center text-xs text-neutral-500 font-medium">
        Task is {taskStatus.toLowerCase()}. Live tracking is concluded.
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 shadow-card space-y-3.5 select-none animate-slide-up">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-part-green text-white flex items-center justify-center shadow-xs">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-heading font-black text-xs text-neutral-900 tracking-tight">
              Live Route Navigation
            </h4>
            <p className="text-[10px] text-neutral-500">
              Geoapify Routing & Real-Time PostGIS Tracking
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        {workerLocation ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-part-green border border-emerald-200 text-[10px] font-heading font-black">
            <span className="w-2 h-2 rounded-full bg-part-green animate-ping" />
            <span>LIVE</span>
          </span>
        ) : (
          <span className="text-[10px] text-neutral-400 font-semibold bg-neutral-100 px-2.5 py-1 rounded-full">
            Awaiting worker GPS
          </span>
        )}
      </div>

      {trackingError && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{trackingError}</span>
        </div>
      )}

      {/* Worker Location Consent Card (When viewing as Worker) */}
      {isWorker && (
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-neutral-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-part-green" />
              <span>Location Sharing Consent</span>
            </span>

            <button
              type="button"
              onClick={() => setHasConsent(!hasConsent)}
              className={`px-3 py-1 rounded-xl text-xs font-heading font-black transition cursor-pointer flex items-center gap-1.5 ${
                hasConsent
                  ? 'bg-part-green text-white shadow-green'
                  : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
              }`}
            >
              {hasConsent ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Sharing Active</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Enable Sharing</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 leading-relaxed">
            {hasConsent
              ? 'Your live GPS coordinates and motorcycle route are shared strictly with the requester until this task is completed.'
              : 'Turn on location sharing to help the requester see your estimated arrival time.'}
          </p>
        </div>
      )}

      {/* ETA & Distance Card */}
      {routeInfo ? (
        <div className="grid grid-cols-2 gap-2 bg-brand-yellow-light/60 border border-brand-yellow/30 p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-part-green text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                Estimated Arrival
              </span>
              <span className="font-heading font-black text-sm text-neutral-900">
                ~{routeInfo.duration_minutes} mins
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-dark text-brand-yellow flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                Distance
              </span>
              <span className="font-heading font-black text-sm text-neutral-900">
                {routeInfo.distance_km} km
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-neutral-50 rounded-2xl text-center text-xs text-neutral-500">
          📍 Task Destination: {taskLocation.locality}
        </div>
      )}

      {/* Interactive MapLibre GL Navigation Map */}
      <div className="h-[250px] rounded-2xl overflow-hidden border border-neutral-200/90 shadow-inner">
        <MapLibreView
          centerLat={workerLocation ? workerLocation.latitude : taskLocation.latitude}
          centerLng={workerLocation ? workerLocation.longitude : taskLocation.longitude}
          zoom={14}
          route={routeInfo}
          workerLocation={workerLocation}
          taskDestination={{
            latitude: taskLocation.latitude,
            longitude: taskLocation.longitude,
            title: taskTitle,
          }}
          className="h-full"
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
        <span>Protected by Supabase RLS Participant Policies</span>
        {lastUpdatedTime && <span>Updated {lastUpdatedTime}</span>}
      </div>
    </div>
  );
};
