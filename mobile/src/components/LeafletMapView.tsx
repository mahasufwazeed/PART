import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Task,
  TASK_CATEGORIES,
  RouteInfo,
  DISTANCE_FILTER_OPTIONS_KM,
  DEFAULT_SEARCH_RADIUS_KM,
  geoapifyService,
} from '@part/shared';
import { useAppStore } from '../store/useAppStore';
import {
  Crosshair,
  Layers,
  MapPin,
  Navigation,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export interface LeafletMapViewProps {
  tasks?: Task[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  interactive?: boolean;
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
  onTaskSelect?: (task: Task) => void;
  onChangeLocationClick?: () => void;
  // Route navigation props
  route?: RouteInfo | null;
  workerLocation?: { latitude: number; longitude: number; heading?: number | null } | null;
  taskDestination?: { latitude: number; longitude: number; title: string } | null;
  // Pin drag mode for location selector
  isPickerMode?: boolean;
  onPickerLocationChange?: (lat: number, lng: number) => void;
  className?: string;
}

// Tile endpoints with legal attribution
const getTileConfig = (style: 'osm-standard' | 'geoapify-bright' | 'positron') => {
  const geoapifyKey = geoapifyService.getApiKey();
  const customOsmUrl =
    (import.meta as any)?.env?.VITE_OSM_TILE_URL ||
    (import.meta as any)?.env?.NEXT_PUBLIC_OSM_TILE_URL;

  if (style === 'osm-standard' || !geoapifyKey) {
    return {
      url: customOsmUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19,
    };
  }

  if (style === 'positron') {
    return {
      url: `https://maps.geoapify.com/v1/tile/positron/{z}/{x}/{y}@2x.png?apiKey=${geoapifyKey}`,
      attribution:
        '&copy; <a href="https://www.geoapify.com/" target="_blank" rel="noopener">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 20,
    };
  }

  // Default: geoapify-bright (Crisp 2x Retina OSM Bright)
  return {
    url: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=${geoapifyKey}`,
    attribution:
      '&copy; <a href="https://www.geoapify.com/" target="_blank" rel="noopener">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 20,
  };
};

/**
 * Helper component to re-center & animate Leaflet when coordinates change
 */
function MapCenterController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    const [lat, lng] = center;
    const [prevLat, prevLng] = prevCenterRef.current;
    if (Math.abs(lat - prevLat) > 0.0001 || Math.abs(lng - prevLng) > 0.0001) {
      prevCenterRef.current = center;
      map.flyTo(center, zoom, { duration: 1.1 });
    }
  }, [center[0], center[1], zoom, map]);

  return null;
}

/**
 * Click / drag handler for Pin Picker Mode
 */
function MapPinPickerEvents({
  onLocationChange,
}: {
  onLocationChange?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

/**
 * Custom Zoom & Fly Controls
 */
function MapZoomButtons() {
  const map = useMap();
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 shadow-md">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="w-8 h-8 bg-white/95 backdrop-blur-xs text-neutral-700 hover:text-part-green hover:bg-white rounded-xl flex items-center justify-center font-bold text-base border border-neutral-200/90 shadow-2xs transition active:scale-95"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="w-8 h-8 bg-white/95 backdrop-blur-xs text-neutral-700 hover:text-part-green hover:bg-white rounded-xl flex items-center justify-center font-bold text-base border border-neutral-200/90 shadow-2xs transition active:scale-95"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  tasks = [],
  centerLat = 12.9815,
  centerLng = 80.218,
  zoom = 13,
  interactive = true,
  radiusKm = DEFAULT_SEARCH_RADIUS_KM,
  onRadiusChange,
  onTaskSelect,
  onChangeLocationClick,
  route = null,
  workerLocation = null,
  taskDestination = null,
  isPickerMode = false,
  onPickerLocationChange,
  className = '',
}) => {
  const { setActiveLocation, userLocation } = useAppStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [tileStyle, setTileStyle] = useState<'geoapify-bright' | 'osm-standard' | 'positron'>('geoapify-bright');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const tileConfig = useMemo(() => getTileConfig(tileStyle), [tileStyle]);

  // Center coordinates
  const currentCenter = useMemo<[number, number]>(() => {
    return [centerLat, centerLng];
  }, [centerLat, centerLng]);

  // User pulse marker beacon
  const userMarkerIcon = useMemo(() => {
    return L.divIcon({
      className: 'part-user-beacon',
      html: `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:36px; height:36px; border-radius:9999px; background:rgba(20,107,58,0.30); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:16px; height:16px; border-radius:9999px; background:#146B3A; border:3px solid #FFFFFF; box-shadow:0 3px 8px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, []);

  // Draggable pin picker icon
  const pickerPinIcon = useMemo(() => {
    return L.divIcon({
      className: 'part-picker-pin',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:grab; transform:translate(-50%, -100%);">
          <div style="background:#146B3A; color:#FFFFFF; padding:6px 10px; border-radius:12px; font-weight:800; font-size:11px; box-shadow:0 6px 16px rgba(0,0,0,0.35); border:2px solid #FFCC00; display:flex; align-items:center; gap:4px; white-space:nowrap;">
            <span>📍 Drag pin to place</span>
          </div>
          <div style="width:2px; height:12px; background:#146B3A;"></div>
          <div style="width:8px; height:8px; border-radius:9999px; background:#146B3A; border:2px solid #FFCC00;"></div>
        </div>
      `,
      iconSize: [120, 50],
      iconAnchor: [60, 50],
    });
  }, []);

  // Worker live location icon
  const workerIcon = useMemo(() => {
    return L.divIcon({
      className: 'part-worker-beacon',
      html: `
        <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
          <div style="width:28px; height:28px; border-radius:9999px; background:#FFCC00; border:2px solid #146B3A; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:14px;">
            🛵
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }, []);

  // Destination icon
  const destinationIcon = useMemo(() => {
    return L.divIcon({
      className: 'part-destination-pin',
      html: `
        <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
          <div style="width:26px; height:26px; border-radius:9999px; background:#DC2626; border:2px solid #FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); color:#FFFFFF; font-size:12px; font-weight:900;">
            🏁
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  // Create task price icon
  const getTaskPriceIcon = useCallback((price: number, isSelected: boolean) => {
    const formatted = Number(price).toLocaleString('en-IN');
    const bg = isSelected ? '#0A3B1F' : '#146B3A';
    const border = isSelected ? '2px solid #FFCC00' : '2px solid #FFFFFF';
    const scale = isSelected ? 'scale(1.12)' : 'scale(1)';

    return L.divIcon({
      className: 'part-task-price-marker',
      html: `
        <div style="
          background:${bg};
          color:#FFFFFF;
          font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight:900;
          font-size:11px;
          padding:3px 8px;
          border-radius:9999px;
          border:${border};
          box-shadow:0 4px 12px rgba(0,0,0,0.30);
          display:flex;
          align-items:center;
          gap:3px;
          cursor:pointer;
          transform:translate(-50%, -50%) ${scale};
          white-space:nowrap;
          transition:transform 0.15s ease, background 0.15s ease;
        ">
          <span style="font-size:10px; color:#FFCC00;">⚡</span>
          <span>₹${formatted}</span>
        </div>
      `,
      iconSize: [64, 28],
      iconAnchor: [32, 14],
    });
  }, []);

  // Convert route coordinates [lng, lat] to Leaflet [lat, lng]
  const polylinePositions = useMemo<[number, number][]>(() => {
    if (!route?.coordinates || route.coordinates.length === 0) return [];
    return route.coordinates.map(([lng, lat]) => [lat, lng]);
  }, [route]);

  // Real GPS Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setActiveLocation({
          coordinates: { latitude, longitude },
          label: 'Current GPS Location, Chennai',
          source: 'gps',
          accuracyMeters: accuracy,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setGpsError('Could not acquire GPS position. Defaulting to Chennai.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const activeCategory = activeTask
    ? TASK_CATEGORIES.find((c) => c.id === activeTask.category_id)
    : null;

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden shadow-sm border border-neutral-200/90 bg-neutral-100 ${
        isPickerMode ? 'h-full min-h-[220px]' : 'min-h-[440px] h-[520px]'
      } ${className}`}
      style={{ isolation: 'isolate' }}
    >
      <MapContainer
        center={currentCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0"
        style={{ minHeight: isPickerMode ? '220px' : '440px', width: '100%', height: '100%' }}
      >
        <MapCenterController center={currentCenter} zoom={zoom} />

        {/* Base Tile Layer */}
        <TileLayer
          key={tileConfig.url}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
        />

        {/* Custom Zoom Buttons */}
        {interactive && <MapZoomButtons />}

        {/* Picker Mode Pin & Events */}
        {isPickerMode ? (
          <>
            <MapPinPickerEvents onLocationChange={onPickerLocationChange} />
            <Marker
              position={currentCenter}
              draggable={true}
              icon={pickerPinIcon}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  onPickerLocationChange?.(pos.lat, pos.lng);
                },
              }}
            />
          </>
        ) : (
          <>
            {/* Active User Location Beacon */}
            <Marker position={currentCenter} icon={userMarkerIcon} zIndexOffset={900} />

            {/* Radius Circle in Meters */}
            <Circle
              center={currentCenter}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#146B3A',
                fillColor: '#146B3A',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4 4',
              }}
            />

            {/* Task Markers with Live INR Price Badges */}
            {tasks.map((task) => {
              if (!task.location?.latitude || !task.location?.longitude) return null;
              const isSelected = activeTask?.id === task.id;
              const pos: [number, number] = [task.location.latitude, task.location.longitude];

              return (
                <Marker
                  key={task.id}
                  position={pos}
                  icon={getTaskPriceIcon(task.budget_inr, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setActiveTask(task);
                    },
                  }}
                >
                  <Popup className="part-task-popup" closeButton={false}>
                    <div className="p-1 min-w-[190px] font-sans">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-part-green bg-part-green-mint px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {task.status || 'OPEN'}
                        </span>
                        <span className="text-[11px] font-bold text-neutral-500">
                          {task.distance_km ? `${task.distance_km.toFixed(1)} km` : ''}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-1 mb-1">
                        {task.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-extrabold text-part-green text-sm">
                          ₹{Number(task.budget_inr).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-neutral-500 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {task.estimated_duration_minutes || 30}m
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onTaskSelect) onTaskSelect(task);
                        }}
                        className="w-full bg-part-green text-white py-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs hover:bg-part-green-dark transition"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Live Navigation Route & Markers (LiveTrackingSheet) */}
            {polylinePositions.length > 0 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: '#146B3A',
                  weight: 5,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}

            {workerLocation && (
              <Marker
                position={[workerLocation.latitude, workerLocation.longitude]}
                icon={workerIcon}
                zIndexOffset={1000}
              />
            )}

            {taskDestination && (
              <Marker
                position={[taskDestination.latitude, taskDestination.longitude]}
                icon={destinationIcon}
                zIndexOffset={950}
              />
            )}
          </>
        )}
      </MapContainer>

      {/* Floating Radius Filter Chips (Top Center - Explore Mode) */}
      {!isPickerMode && onRadiusChange && (
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-2xl border border-neutral-200/90 shadow-md overflow-x-auto max-w-[calc(100%-80px)]">
          <span className="text-[10px] font-bold text-neutral-400 pl-1.5 pr-0.5 uppercase tracking-wider hidden sm:inline">
            Radius:
          </span>
          {DISTANCE_FILTER_OPTIONS_KM.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onRadiusChange(km)}
              className={`px-2 py-0.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                radiusKm === km
                  ? 'bg-part-green text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {km}km
            </button>
          ))}
        </div>
      )}

      {/* Floating GPS Locate Button (Bottom Right) */}
      {!isPickerMode && (
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          aria-label="Locate me with GPS"
          className="absolute bottom-4 right-4 z-[1000] w-10 h-10 bg-white/95 backdrop-blur-xs text-part-green hover:text-part-green-dark rounded-2xl flex items-center justify-center shadow-lg border border-neutral-200/90 active:scale-95 transition cursor-pointer"
        >
          {isLocating ? (
            <RefreshCw className="w-5 h-5 animate-spin text-part-green" />
          ) : (
            <Crosshair className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Map Tile Style Switcher (Bottom Left) */}
      {!isPickerMode && (
        <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-2xl border border-neutral-200/90 shadow-md">
          <Layers className="w-3.5 h-3.5 text-neutral-400 ml-1.5 mr-0.5" />
          <button
            type="button"
            onClick={() => setTileStyle('geoapify-bright')}
            className={`px-2 py-0.5 rounded-xl text-[10px] font-bold transition ${
              tileStyle === 'geoapify-bright'
                ? 'bg-part-green text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            OSM Bright
          </button>
          <button
            type="button"
            onClick={() => setTileStyle('osm-standard')}
            className={`px-2 py-0.5 rounded-xl text-[10px] font-bold transition ${
              tileStyle === 'osm-standard'
                ? 'bg-part-green text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            OSM Standard
          </button>
          <button
            type="button"
            onClick={() => setTileStyle('positron')}
            className={`px-2 py-0.5 rounded-xl text-[10px] font-bold transition ${
              tileStyle === 'positron'
                ? 'bg-part-green text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Clean Light
          </button>
        </div>
      )}

      {/* GPS Error Notification */}
      {gpsError && (
        <div className="absolute top-14 left-3 right-3 z-[1000] bg-red-500/90 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGpsError(null)}
            className="text-[10px] font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Selected Task Bottom Preview Card */}
      {activeTask && !isPickerMode && (
        <div className="absolute bottom-16 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-neutral-200/90 shadow-xl animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-0.5">
                <span className="font-bold text-part-green bg-part-green-mint px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                  {activeCategory?.name_en || 'Task'}
                </span>
                <span>•</span>
                <span>{activeTask.location?.locality || 'Chennai'}</span>
                {activeTask.distance_km !== undefined && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-part-green">
                      {activeTask.distance_km.toFixed(1)} km
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-heading font-extrabold text-neutral-900 text-sm truncate">
                {activeTask.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTask(null)}
              className="text-neutral-400 hover:text-neutral-700 text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-neutral-100">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Offered Payout
              </span>
              <span className="font-heading font-black text-part-green text-base">
                ₹{Number(activeTask.budget_inr).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onTaskSelect) {
                  onTaskSelect(activeTask);
                }
              }}
              className="bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span>View & Apply</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
