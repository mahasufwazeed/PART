import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix standard Leaflet default marker icons for Vite/Webpack bundlers
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import {
  Task,
  TASK_CATEGORIES,
  RouteInfo,
  DISTANCE_FILTER_OPTIONS_KM,
  DEFAULT_SEARCH_RADIUS_KM,
  geoapifyService,
} from '@part/shared';
import { useAppStore } from '../../store/useAppStore';
import {
  Crosshair,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
  Maximize2,
  Navigation,
} from 'lucide-react';

// Configure Default Leaflet Marker Icons
if (typeof window !== 'undefined' && L.Icon?.Default?.prototype) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  });
}

export type PartLeafletMapProps = {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  tasks?: Task[];
  onTaskSelect?: (task: Task) => void;
  onRadiusChange?: (km: number) => void;
  userGpsCoords?: { latitude: number; longitude: number } | null;
  className?: string;
  interactive?: boolean;
  zoom?: number;
  autoFitBounds?: boolean;
  isPickerMode?: boolean;
  onPickerLocationChange?: (lat: number, lng: number) => void;
  route?: RouteInfo | null;
  workerLocation?: { latitude: number; longitude: number; heading?: number | null } | null;
  taskDestination?: { latitude: number; longitude: number; title: string } | null;
};

// Tile provider configuration
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

  // Default: Retina 2x OSM Bright (Geoapify)
  return {
    url: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=${geoapifyKey}`,
    attribution:
      '&copy; <a href="https://www.geoapify.com/" target="_blank" rel="noopener">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 20,
  };
};

/**
 * Controller to smoothly update map center & dynamic radius fitting
 */
function UpdateMapCenter({
  center,
  radiusKm,
  autoFitBounds,
}: {
  center: LatLngExpression;
  radiusKm?: number;
  autoFitBounds?: boolean;
}) {
  const map = useMap();
  const prevCenterRef = useRef<LatLngExpression>(center);

  useEffect(() => {
    const coords = Array.isArray(center)
      ? (center as [number, number])
      : [(center as any).lat, (center as any).lng];
    const prev = prevCenterRef.current;
    const prevCoords = Array.isArray(prev)
      ? (prev as [number, number])
      : [(prev as any).lat, (prev as any).lng];

    const hasMoved =
      Math.abs(coords[0] - prevCoords[0]) > 0.0001 ||
      Math.abs(coords[1] - prevCoords[1]) > 0.0001;

    if (autoFitBounds && radiusKm) {
      const circle = L.circle([coords[0], coords[1]], { radius: radiusKm * 1000 });
      map.fitBounds(circle.getBounds(), {
        padding: [24, 24],
        maxZoom: 15,
        animate: true,
      });
    } else if (hasMoved) {
      prevCenterRef.current = center;
      map.flyTo([coords[0], coords[1]], map.getZoom() || 13, { duration: 1.1 });
    }
  }, [map, center, radiusKm, autoFitBounds]);

  return null;
}

/**
 * Events handler for Drag/Click in Pin Picker Mode
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
 * Map zoom in / zoom out controls
 */
function MapZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 shadow-md">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="w-8 h-8 bg-white/95 backdrop-blur-xs text-neutral-700 hover:text-part-green hover:bg-white rounded-xl flex items-center justify-center font-bold text-base border border-neutral-200/90 shadow-2xs transition active:scale-95 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="w-8 h-8 bg-white/95 backdrop-blur-xs text-neutral-700 hover:text-part-green hover:bg-white rounded-xl flex items-center justify-center font-bold text-base border border-neutral-200/90 shadow-2xs transition active:scale-95 cursor-pointer"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Fit Radius Bounds Control Button
 */
function MapFitBoundsButton({
  center,
  radiusKm,
}: {
  center: [number, number];
  radiusKm: number;
}) {
  const map = useMap();

  const handleFit = () => {
    const circle = L.circle(center, { radius: radiusKm * 1000 });
    map.fitBounds(circle.getBounds(), {
      padding: [30, 30],
      maxZoom: 15,
      animate: true,
    });
  };

  return (
    <button
      type="button"
      onClick={handleFit}
      title="Fit view to search radius"
      aria-label="Fit view to search radius"
      className="w-8 h-8 bg-white/95 backdrop-blur-xs text-neutral-700 hover:text-part-green hover:bg-white rounded-xl flex items-center justify-center border border-neutral-200/90 shadow-2xs transition active:scale-95 cursor-pointer"
    >
      <Maximize2 className="w-3.5 h-3.5" />
    </button>
  );
}

export default function PartLeafletMap({
  latitude,
  longitude,
  radiusKm = DEFAULT_SEARCH_RADIUS_KM,
  tasks = [],
  onTaskSelect,
  onRadiusChange,
  userGpsCoords = null,
  className = '',
  interactive = true,
  zoom = 13,
  autoFitBounds = false,
  isPickerMode = false,
  onPickerLocationChange,
  route = null,
  workerLocation = null,
  taskDestination = null,
}: PartLeafletMapProps) {
  const { activeLocation, setActiveLocation } = useAppStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [tileStyle, setTileStyle] = useState<'geoapify-bright' | 'osm-standard' | 'positron'>('geoapify-bright');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Fallback to activeLocation coordinates or Chennai center
  const centerLat = latitude ?? activeLocation?.coordinates?.latitude ?? 12.9815;
  const centerLng = longitude ?? activeLocation?.coordinates?.longitude ?? 80.218;

  const center: LatLngExpression = [centerLat, centerLng];
  const tileConfig = useMemo(() => getTileConfig(tileStyle), [tileStyle]);

  // Search Center Marker Icon (Yellow & Green Marker)
  const searchCenterIcon = useMemo(() => {
    return L.divIcon({
      className: 'part-search-center-marker',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%);">
          <div style="background:#146B3A; color:#FFFFFF; padding:4px 8px; border-radius:10px; font-weight:800; font-size:10px; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid #FFCC00; display:flex; align-items:center; gap:3px; white-space:nowrap;">
            <span>📍 Search Center</span>
          </div>
          <div style="width:2px; height:8px; background:#146B3A;"></div>
          <div style="width:6px; height:6px; border-radius:9999px; background:#FFCC00; border:1.5px solid #146B3A;"></div>
        </div>
      `,
      iconSize: [110, 40],
      iconAnchor: [55, 40],
    });
  }, []);

  // Physical GPS Beacon (Pulsing Emerald Green)
  const gpsBeaconIcon = useMemo(() => {
    return L.divIcon({
      className: 'part-gps-beacon',
      html: `
        <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:34px; height:34px; border-radius:9999px; background:rgba(16,185,129,0.35); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:14px; height:14px; border-radius:9999px; background:#10B981; border:3px solid #FFFFFF; box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }, []);

  // Draggable Pin Picker Icon
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

  // Worker Navigation Icon
  const workerIcon = useMemo(() => {
    return L.divIcon({
      className: 'part-worker-beacon',
      html: `
        <div style="width:28px; height:28px; border-radius:9999px; background:#FFCC00; border:2px solid #146B3A; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:14px;">
          🛵
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, []);

  // Destination Icon
  const destinationIcon = useMemo(() => {
    return L.divIcon({
      className: 'part-destination-pin',
      html: `
        <div style="width:26px; height:26px; border-radius:9999px; background:#DC2626; border:2px solid #FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); color:#FFFFFF; font-size:12px; font-weight:900;">
          🏁
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  }, []);

  // Create Task Price Icon (INR formatted)
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

  // Convert GeoJSON route [lng, lat] to Leaflet [lat, lng]
  const polylinePositions = useMemo<[number, number][]>(() => {
    if (!route?.coordinates || route.coordinates.length === 0) return [];
    return route.coordinates.map(([lng, lat]) => [lat, lng]);
  }, [route]);

  // GPS Locate Trigger
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: gpsLat, longitude: gpsLng, accuracy } = pos.coords;
        setActiveLocation({
          coordinates: { latitude: gpsLat, longitude: gpsLng },
          label: 'Current GPS Location, Chennai',
          source: 'gps',
          accuracyMeters: accuracy,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setGpsError('Could not acquire GPS position. Defaulting to selected location.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const activeCategory = activeTask
    ? TASK_CATEGORIES.find((c) => c.id === activeTask.category_id)
    : null;

  // Determine if device GPS is at a different location than search center
  const showDistinctGpsMarker =
    userGpsCoords &&
    (Math.abs(userGpsCoords.latitude - centerLat) > 0.001 ||
      Math.abs(userGpsCoords.longitude - centerLng) > 0.001);

  return (
    <div
      className={`relative w-full rounded-[20px] overflow-hidden shadow-sm border border-neutral-200/90 bg-neutral-100 ${
        isPickerMode ? 'h-full min-h-[220px]' : 'min-h-[440px] h-[550px]'
      } ${className}`}
      style={{ isolation: 'isolate' }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0"
        style={{
          height: isPickerMode ? '100%' : '550px',
          width: '100%',
          borderRadius: '20px',
        }}
      >
        <TileLayer
          key={tileConfig.url}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
        />

        <UpdateMapCenter center={center} radiusKm={radiusKm} autoFitBounds={autoFitBounds} />

        {/* Custom Zoom Controls */}
        {interactive && <MapZoomControls />}

        {/* Pin Picker Mode */}
        {isPickerMode ? (
          <>
            <MapPinPickerEvents onLocationChange={onPickerLocationChange} />
            <Marker
              position={center}
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
            {/* Selected Search Center Marker */}
            <Marker position={center} icon={searchCenterIcon} zIndexOffset={900}>
              <Popup closeButton={false}>
                <div className="text-xs p-1 font-sans">
                  <span className="font-bold text-part-green block">Search Location</span>
                  <span className="text-neutral-500">
                    Finding tasks within {radiusKm} km radius
                  </span>
                </div>
              </Popup>
            </Marker>

            {/* Distinct Physical GPS Marker (when browsing a different area) */}
            {showDistinctGpsMarker && userGpsCoords && (
              <Marker
                position={[userGpsCoords.latitude, userGpsCoords.longitude]}
                icon={gpsBeaconIcon}
                zIndexOffset={850}
              >
                <Popup closeButton={false}>
                  <div className="text-xs p-1 font-sans">
                    <span className="font-bold text-emerald-600 block">Your Device GPS Location</span>
                    <span className="text-neutral-500">Physical position of your mobile device</span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Dynamic Search Radius Circle in Meters */}
            <Circle
              center={center}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#08783e',
                fillColor: '#08783e',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4 4',
              }}
            />

            {/* Live Task Price Markers */}
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

            {/* Navigation Route & Tracking Markers */}
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

      {/* Floating Radius Filter Chips (Top Left - Explore Mode) */}
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

      {/* Floating Right Actions: Fit Bounds & GPS Locate */}
      {!isPickerMode && (
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Fit Bounds Button */}
          <div className="shadow-lg rounded-xl overflow-hidden">
            <MapFitBoundsButton center={[centerLat, centerLng]} radiusKm={radiusKm} />
          </div>

          {/* GPS Locate Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            aria-label="Locate me with GPS"
            className="w-10 h-10 bg-white/95 backdrop-blur-xs text-part-green hover:text-part-green-dark rounded-2xl flex items-center justify-center shadow-lg border border-neutral-200/90 active:scale-95 transition cursor-pointer"
          >
            {isLocating ? (
              <RefreshCw className="w-5 h-5 animate-spin text-part-green" />
            ) : (
              <Crosshair className="w-5 h-5" />
            )}
          </button>
        </div>
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
              className="text-neutral-400 hover:text-neutral-700 text-xs font-bold p-1 cursor-pointer"
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
}
