import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Task, TASK_CATEGORIES, RouteInfo } from '@part/shared';
import { geoapifyService } from '@part/shared';
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

export const MapLibreView: React.FC<MapLibreViewProps> = ({
  tasks = [],
  centerLat = 12.9815,
  centerLng = 80.218,
  zoom = 13,
  interactive = true,
  radiusKm = 5,
  onRadiusChange,
  onTaskSelect,
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
  const [currentStyle, setCurrentStyle] = useState<'osm-bright' | 'positron'>('osm-bright');
  const [isLocating, setIsLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const apiKey = geoapifyService.getApiKey();

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const styleUrl = `https://maps.geoapify.com/v1/styles/${currentStyle}/style.json?apiKey=${apiKey}`;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [centerLng, centerLat],
      zoom: zoom,
      attributionControl: false,
      interactive: interactive,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© Geoapify | © OpenStreetMap contributors',
      }),
      'bottom-right'
    );

    map.on('load', () => {
      setMapLoaded(true);

      // Add Radius Circle Source & Layer
      if (!isPickerMode) {
        const circleData = createGeoJSONCircle([centerLng, centerLat], radiusKm);
        map.addSource('radius-circle-source', {
          type: 'geojson',
          data: circleData as any,
        });

        map.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle-source',
          paint: {
            'fill-color': '#146B3A',
            'fill-opacity': 0.08,
          },
        });

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

      // Add Route Polyline Source & Layer
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

      map.addLayer({
        id: 'route-line-casing',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#0C4B26',
          'line-width': 6,
          'line-opacity': 0.5,
        },
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#146B3A',
          'line-width': 4,
        },
      });
    });

    // If Picker mode, report map center on moveend
    if (isPickerMode && onPickerLocationChange) {
      map.on('moveend', () => {
        const center = map.getCenter();
        onPickerLocationChange(center.lat, center.lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [currentStyle, isPickerMode]);

  // Update center smoothly
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.easeTo({
      center: [centerLng, centerLat],
      duration: 1000,
    });
  }, [centerLat, centerLng, mapLoaded]);

  // Update radius circle
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || isPickerMode) return;
    const source = mapRef.current.getSource('radius-circle-source') as maplibregl.GeoJSONSource;
    if (source) {
      const circleData = createGeoJSONCircle([centerLng, centerLat], radiusKm);
      source.setData(circleData as any);
    }
  }, [centerLat, centerLng, radiusKm, mapLoaded, isPickerMode]);

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

      // Fit bounds to route if valid
      if (route?.coordinates && route.coordinates.length > 1) {
        const bounds = new maplibregl.LngLatBounds(
          route.coordinates[0],
          route.coordinates[0]
        );
        route.coordinates.forEach((coord) => bounds.extend(coord));
        mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 1200 });
      }
    }
  }, [route, mapLoaded]);

  // Update User Location Marker
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

  // Update Task Markers
  useEffect(() => {
    if (!mapRef.current || isPickerMode) return;

    // Clear existing task markers
    taskMarkersRef.current.forEach((m) => m.remove());
    taskMarkersRef.current = [];

    tasks.forEach((task) => {
      if (!task.location?.latitude || !task.location?.longitude) return;

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
          <span>₹${task.budget_inr}</span>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
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

  // GPS Locate Action
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1200,
          });
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-neutral-200/90 shadow-card bg-neutral-100 flex flex-col select-none ${className}`}
    >
      {/* MapLibre Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-[400px] sm:h-[460px] z-10" />

      {/* Center Pin Indicator for Pin Picker Mode */}
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
          <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-200/80 shadow-quick text-xs font-heading font-black text-neutral-900 flex items-center gap-1.5 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-part-green animate-pulse" />
            <span>MapLibre GL Map</span>
            <span className="text-neutral-300">•</span>
            <span className="text-part-green">{tasks.length} live tasks</span>
          </div>

          {/* Locate Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            title="Locate Me (GPS)"
            className={`w-9 h-9 rounded-2xl bg-white shadow-quick border border-neutral-200 flex items-center justify-center text-neutral-700 hover:text-part-green active:scale-95 transition pointer-events-auto cursor-pointer ${
              isLocating ? 'animate-spin text-part-green' : ''
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Distance Filters Bar (1, 3, 5, 10 km) */}
      {!isPickerMode && onRadiusChange && (
        <div className="absolute top-13 left-3 z-20 pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-neutral-200 shadow-xs text-xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Radius:
          </span>
          {[1, 3, 5, 10].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onRadiusChange(km)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-heading font-black transition cursor-pointer ${
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
      <div className="absolute bottom-4 right-3 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() =>
            setCurrentStyle((prev) =>
              prev === 'osm-bright' ? 'positron' : 'osm-bright'
            )
          }
          className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-neutral-200 shadow-quick text-[11px] font-heading font-bold text-neutral-700 hover:text-part-green flex items-center gap-1 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-part-green" />
          <span>{currentStyle === 'osm-bright' ? 'Geoapify Vector' : 'Positron'}</span>
        </button>
      </div>

      {/* Active Task Bottom Preview Sheet */}
      {activeTask && !isPickerMode && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-white/98 backdrop-blur-md p-3.5 rounded-2xl border border-neutral-200 shadow-2xl animate-slide-up space-y-2 pointer-events-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-heading font-black uppercase tracking-wider text-part-green bg-part-green-mint px-2 py-0.5 rounded-full">
                {activeTask.location?.locality || 'Chennai'}
              </span>
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
            <div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">
                Reward
              </span>
              <span className="font-heading font-black text-base text-neutral-950">
                ₹{activeTask.budget_inr}
              </span>
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
              <span>View Task</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
