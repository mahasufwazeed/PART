import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Task,
  TASK_CATEGORIES,
  RouteInfo,
  DISTANCE_FILTER_OPTIONS_KM,
  geoapifyService,
} from '@part/shared';
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
} from 'lucide-react';

interface MapLibreViewProps {
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

/**
 * Generate a GeoJSON Polygon circle approximating radiusKm around [lng, lat]
 */
function createGeoJSONCircle(center: [number, number], radiusKm: number, points = 64) {
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]);

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coords],
    },
    properties: {},
  };
}

/**
 * High-reliability fallback raster style if vector endpoint encounters issues.
 * Requests exclusively from Geoapify or OSM without mixing in mirror lists.
 */
const getGeoapifyRasterStyle = (apiKey: string): maplibregl.StyleSpecification => ({
  version: 8,
  sources: {
    'geoapify-raster': {
      type: 'raster',
      tiles: apiKey
        ? [`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=${apiKey}`]
        : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: apiKey ? 512 : 256,
      attribution: '© Geoapify | © OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'geoapify-raster-layer',
      type: 'raster',
      source: 'geoapify-raster',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
});

export const MapLibreView: React.FC<MapLibreViewProps> = ({
  tasks = [],
  centerLat = 12.9815,
  centerLng = 80.218,
  zoom = 13,
  interactive = true,
  radiusKm = 5,
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const taskMarkersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const workerMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [currentStyle, setCurrentStyle] = useState<'osm-bright' | 'positron' | 'raster'>('osm-bright');
  const [isLocating, setIsLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFallbackRaster, setIsFallbackRaster] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const apiKey = geoapifyService.getApiKey();

  // Helper to re-add sources & layers whenever style loads or changes
  const attachCustomLayers = useCallback((map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) return;

    // 1. Radius Circle
    if (!isPickerMode) {
      if (!map.getSource('radius-circle-source')) {
        const circleData = createGeoJSONCircle([centerLng, centerLat], radiusKm);
        map.addSource('radius-circle-source', {
          type: 'geojson',
          data: circleData as any,
        });

        if (!map.getLayer('radius-circle-fill')) {
          map.addLayer({
            id: 'radius-circle-fill',
            type: 'fill',
            source: 'radius-circle-source',
            paint: {
              'fill-color': '#146B3A',
              'fill-opacity': 0.08,
            },
          });
        }

        if (!map.getLayer('radius-circle-outline')) {
          map.addLayer({
            id: 'radius-circle-outline',
            type: 'line',
            source: 'radius-circle-source',
            paint: {
              'line-color': '#146B3A',
              'line-width': 2,
              'line-dasharray': [3, 3],
            },
          });
        }
      }
    }

    // 2. Route Line
    if (!map.getSource('route-source')) {
      map.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route?.coordinates || [],
          },
        },
      });

      if (!map.getLayer('route-line-casing')) {
        map.addLayer({
          id: 'route-line-casing',
          type: 'line',
          source: 'route-source',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#0C4B26',
            'line-width': 6,
            'line-opacity': 0.5,
          },
        });
      }

      if (!map.getLayer('route-line')) {
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#146B3A',
            'line-width': 4,
          },
        });
      }
    }
  }, [centerLat, centerLng, radiusKm, route, isPickerMode]);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any existing map
    if (mapRef.current) {
      taskMarkersRef.current.forEach((m) => m.remove());
      taskMarkersRef.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (workerMarkerRef.current) {
        workerMarkerRef.current.remove();
        workerMarkerRef.current = null;
      }
      mapRef.current.remove();
      mapRef.current = null;
    }

    const styleDef: string | maplibregl.StyleSpecification =
      currentStyle === 'raster'
        ? getGeoapifyRasterStyle(apiKey)
        : `https://maps.geoapify.com/v1/styles/${currentStyle}/style.json?apiKey=${apiKey}`;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: styleDef,
        center: [centerLng, centerLat],
        zoom: zoom,
        attributionControl: false,
        interactive: interactive,
      });
    } catch (initErr: any) {
      console.warn('MapLibre WebGL init failed, falling back to raster style:', initErr);
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getGeoapifyRasterStyle(apiKey),
        center: [centerLng, centerLat],
        zoom: zoom,
        attributionControl: false,
        interactive: interactive,
      });
      setIsFallbackRaster(true);
    }

    // Graceful error fallback for style / tile fetch failures
    let fallbackApplied = false;
    map.on('error', (e) => {
      if (
        !fallbackApplied &&
        currentStyle !== 'raster' &&
        e.error &&
        (e.error.message?.includes('style') ||
          e.error.message?.includes('Failed to fetch') ||
          e.error.message?.includes('401') ||
          e.error.message?.includes('403') ||
          e.error.message?.includes('NetworkError'))
      ) {
        fallbackApplied = true;
        setIsFallbackRaster(true);
        console.warn('Geoapify vector style fallback to high-reliability raster tiles:', e.error);
        try {
          map.setStyle(getGeoapifyRasterStyle(apiKey));
        } catch {}
      }
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© Geoapify | © OpenStreetMap contributors',
      }),
      'bottom-right'
    );

    map.on('style.load', () => {
      setMapLoaded(true);
      setMapError(null);
      attachCustomLayers(map);
      map.resize();
    });

    map.on('load', () => {
      setMapLoaded(true);
      attachCustomLayers(map);
      map.resize();
    });

    // If Picker mode, report center coordinates on drag end
    if (isPickerMode && onPickerLocationChange) {
      map.on('moveend', () => {
        const center = map.getCenter();
        onPickerLocationChange(center.lat, center.lng);
      });
    }

    // Auto-resize on container dimensions change
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const t1 = setTimeout(() => map.resize(), 60);
    const t2 = setTimeout(() => map.resize(), 180);
    const t3 = setTimeout(() => map.resize(), 400);

    mapRef.current = map;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) resizeObserver.disconnect();
      taskMarkersRef.current.forEach((m) => m.remove());
      taskMarkersRef.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (workerMarkerRef.current) {
        workerMarkerRef.current.remove();
        workerMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [currentStyle, isPickerMode]);

  // Update center smoothly when active location changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.easeTo({
      center: [centerLng, centerLat],
      duration: 800,
    });
  }, [centerLat, centerLng, mapLoaded]);

  // Update radius circle source
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || isPickerMode) return;
    const source = mapRef.current.getSource('radius-circle-source') as maplibregl.GeoJSONSource;
    if (source) {
      const circleData = createGeoJSONCircle([centerLng, centerLat], radiusKm);
      source.setData(circleData as any);
    } else {
      attachCustomLayers(mapRef.current);
    }
  }, [centerLat, centerLng, radiusKm, mapLoaded, isPickerMode, attachCustomLayers]);

  // Update Route Polyline
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('route-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route?.coordinates || [],
        },
      });

      if (route?.coordinates && route.coordinates.length > 1) {
        const bounds = new maplibregl.LngLatBounds(
          route.coordinates[0],
          route.coordinates[0]
        );
        route.coordinates.forEach((coord) => bounds.extend(coord));
        mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 1000 });
      }
    }
  }, [route, mapLoaded]);

  // Update User Location Beacon Marker
  useEffect(() => {
    if (!mapRef.current || isPickerMode) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-pulse-marker';
      el.innerHTML = `
        <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:34px; height:34px; border-radius:9999px; background:rgba(20,107,58,0.35); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:16px; height:16px; border-radius:9999px; background:#146B3A; border:3px solid #FFFFFF; box-shadow:0 3px 8px rgba(0,0,0,0.35);"></div>
        </div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([centerLng, centerLat])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([centerLng, centerLat]);
    }
  }, [centerLat, centerLng, isPickerMode]);

  // Update Live Worker Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (workerLocation) {
      if (!workerMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'worker-live-marker';
        el.innerHTML = `
          <div style="
            background:#FFCC00;
            color:#121212;
            width:36px;
            height:36px;
            border-radius:9999px;
            border:3px solid #FFFFFF;
            box-shadow:0 4px 12px rgba(0,0,0,0.35);
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:18px;
            position:relative;
            cursor:pointer;
          ">
            <span>🛵</span>
            <div style="
              position:absolute;
              bottom:-6px;
              background:#146B3A;
              color:#FFFFFF;
              font-size:8px;
              font-weight:900;
              padding:1px 4px;
              border-radius:4px;
              white-space:nowrap;
            ">LIVE</div>
          </div>
        `;
        workerMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([workerLocation.longitude, workerLocation.latitude])
          .addTo(mapRef.current);
      } else {
        workerMarkerRef.current.setLngLat([
          workerLocation.longitude,
          workerLocation.latitude,
        ]);
      }
    } else if (workerMarkerRef.current) {
      workerMarkerRef.current.remove();
      workerMarkerRef.current = null;
    }
  }, [workerLocation]);

  // Update Task Markers (Live Price Markers)
  useEffect(() => {
    if (!mapRef.current || isPickerMode) return;

    // Clear previous task markers
    taskMarkersRef.current.forEach((m) => m.remove());
    taskMarkersRef.current = [];

    tasks.forEach((task) => {
      if (!task.location?.latitude || !task.location?.longitude) return;

      const formattedPrice = Number(task.budget_inr).toLocaleString('en-IN');
      const el = document.createElement('div');
      el.className = 'maplibre-task-pill';
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="
          background:#146B3A;
          color:#FFFFFF;
          font-family:system-ui, -apple-system, sans-serif;
          font-weight:900;
          font-size:11px;
          padding:4px 9px;
          border-radius:9999px;
          border:2px solid #FFFFFF;
          box-shadow:0 4px 10px rgba(0,0,0,0.25);
          display:flex;
          align-items:center;
          gap:4px;
          transition:transform 0.15s ease, background 0.15s ease;
          white-space:nowrap;
        ">
          <span style="font-size:10px; color:#FFCC00;">⚡</span>
          <span>₹${formattedPrice}</span>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.12)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([task.location.longitude, task.location.latitude])
        .addTo(mapRef.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveTask(task);
        if (mapRef.current) {
          mapRef.current.easeTo({
            center: [task.location!.longitude, task.location!.latitude - 0.003],
            zoom: 14.5,
            duration: 800,
          });
        }
      });

      taskMarkersRef.current.push(marker);
    });
  }, [tasks, isPickerMode]);

  // GPS Recenter Button Handler
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15.5,
            duration: 1000,
          });
        }
        if (isPickerMode && onPickerLocationChange) {
          onPickerLocationChange(latitude, longitude);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS recenter error:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [isPickerMode, onPickerLocationChange]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut({ duration: 300 });
    }
  };

  const activeCategory = activeTask
    ? TASK_CATEGORIES.find((c) => c.id === activeTask.category_id)
    : null;

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-neutral-200/90 shadow-card bg-neutral-100 flex flex-col select-none ${className}`}
    >
      {/* MapLibre Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%' }}
        className={`relative z-10 w-full ${isPickerMode ? 'h-[220px] min-h-[220px]' : 'h-[400px] sm:h-[480px] min-h-[380px]'}`}
      />

      {/* Floating Center Pin for Pin Picker Mode */}
      {isPickerMode && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
          <div className="flex flex-col items-center -translate-y-6">
            <div className="w-10 h-10 rounded-full bg-part-green text-white border-2 border-white shadow-xl flex items-center justify-center animate-bounce">
              <MapPin className="w-5 h-5 fill-white" />
            </div>
            <div className="w-3 h-1.5 bg-neutral-900/40 rounded-full blur-[1px] mt-1" />
          </div>
        </div>
      )}

      {/* Top Floating Control Bar (Non-Picker Mode) */}
      {!isPickerMode && (
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          {/* Status Badge */}
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200/80 shadow-quick text-xs font-heading font-black text-neutral-900 flex items-center gap-1.5 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-part-green animate-pulse" />
            <span>MapLibre GL</span>
            <span className="text-neutral-300">•</span>
            <span className="text-part-green">{tasks.length} live tasks</span>
            {isFallbackRaster && (
              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
                Raster Tile Mode
              </span>
            )}
          </div>

          {/* Top Right Navigation Controls (Locate + Zoom In + Zoom Out) */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleLocateMe}
              title="Locate Me (Current GPS)"
              className={`w-9 h-9 rounded-2xl bg-white shadow-quick border border-neutral-200 flex items-center justify-center text-neutral-700 hover:text-part-green active:scale-95 transition cursor-pointer ${
                isLocating ? 'animate-spin text-part-green' : ''
              }`}
            >
              <Crosshair className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              className="w-9 h-9 rounded-2xl bg-white shadow-quick border border-neutral-200 flex items-center justify-center text-neutral-700 hover:text-part-green active:scale-95 transition cursor-pointer font-black text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="w-9 h-9 rounded-2xl bg-white shadow-quick border border-neutral-200 flex items-center justify-center text-neutral-700 hover:text-part-green active:scale-95 transition cursor-pointer font-black text-sm"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating GPS Locate Button for Pin Picker Mode */}
      {isPickerMode && (
        <div className="absolute top-2.5 right-2.5 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={handleLocateMe}
            title="Snap to Current GPS Location"
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-neutral-200 flex items-center justify-center text-part-green hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Standardized Distance Filters Bar: 1, 3, 5, 10, 15, 25 km */}
      {!isPickerMode && onRadiusChange && (
        <div className="absolute bottom-3 left-3 z-20 pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-neutral-200 shadow-quick text-xs overflow-x-auto max-w-[calc(100%-110px)] scrollbar-none">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider shrink-0">
            Radius:
          </span>
          {DISTANCE_FILTER_OPTIONS_KM.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onRadiusChange(km)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-heading font-black transition cursor-pointer shrink-0 ${
                radiusKm === km
                  ? 'bg-part-green text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {km}km
            </button>
          ))}
        </div>
      )}

      {/* Map Style Toggle */}
      {!isPickerMode && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() =>
              setCurrentStyle((prev) =>
                prev === 'osm-bright' ? 'positron' : prev === 'positron' ? 'raster' : 'osm-bright'
              )
            }
            title="Switch map styling"
            className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-neutral-200 shadow-quick text-[11px] font-heading font-bold text-neutral-700 hover:text-part-green flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-part-green" />
            <span>
              {currentStyle === 'osm-bright'
                ? 'Vector Bright'
                : currentStyle === 'positron'
                ? 'Positron'
                : 'Raster Tile'}
            </span>
          </button>
        </div>
      )}

      {/* Empty State Banner Overlay if 0 tasks found */}
      {!isPickerMode && mapLoaded && tasks.length === 0 && (
        <div className="absolute top-14 left-3 right-3 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-neutral-200 shadow-md flex items-center justify-between gap-2 pointer-events-auto animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-bold text-xs text-neutral-900 block truncate">
                No nearby tasks within {radiusKm} km
              </span>
              <span className="text-[10px] text-neutral-500 block truncate">
                Try expanding search radius or choosing another area.
              </span>
            </div>
          </div>
          {onRadiusChange && radiusKm < 25 && (
            <button
              type="button"
              onClick={() => onRadiusChange(Math.min(25, radiusKm * 2))}
              className="px-2.5 py-1 bg-part-green text-white font-heading font-black text-[10px] rounded-xl shrink-0 cursor-pointer hover:bg-part-green-dark"
            >
              Expand Radius
            </button>
          )}
        </div>
      )}

      {/* Active Task Bottom Preview Sheet */}
      {activeTask && !isPickerMode && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-white/98 backdrop-blur-md p-3.5 rounded-2xl border border-neutral-200 shadow-2xl animate-slide-up space-y-2 pointer-events-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-part-green bg-part-green-mint px-2 py-0.5 rounded-full">
                  {activeTask.location?.locality || 'Chennai'}
                </span>
                {activeCategory && (
                  <span
                    style={{ backgroundColor: `${activeCategory.accentColor}20`, color: activeCategory.accentColor }}
                    className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full"
                  >
                    {activeCategory.name_en}
                  </span>
                )}
                {activeTask.distance_km && (
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {activeTask.distance_km} km away
                  </span>
                )}
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                  {activeTask.status}
                </span>
              </div>
              <h4 className="font-heading font-black text-xs text-neutral-900 mt-1 line-clamp-1">
                {activeTask.title}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setActiveTask(null)}
              className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-neutral-600 line-clamp-1">
            {activeTask.description}
          </p>

          <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">
                  Reward
                </span>
                <span className="font-heading font-black text-base text-neutral-950">
                  ₹{Number(activeTask.budget_inr).toLocaleString('en-IN')}
                </span>
              </div>

              {activeTask.estimated_duration_minutes && (
                <div className="hidden sm:block border-l border-neutral-200 pl-3">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">
                    Duration
                  </span>
                  <span className="font-heading font-bold text-xs text-neutral-700">
                    ~{activeTask.estimated_duration_minutes} mins
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (onTaskSelect) {
                  onTaskSelect(activeTask);
                }
                setActiveTask(null);
              }}
              className="px-3.5 py-1.5 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-xl shadow-green flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
