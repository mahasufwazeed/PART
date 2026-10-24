import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Task, TASK_CATEGORIES } from '@part/shared';
import { useAppStore } from '../store/useAppStore';
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  Crosshair,
  Sliders,
  ChevronRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Props {
  tasks: Task[];
  centerLat?: number;
  centerLng?: number;
  initialRadiusKm?: number;
  onRadiusChange?: (km: number) => void;
  className?: string;
}

export const RealtimeMap: React.FC<Props> = ({
  tasks,
  centerLat,
  centerLng,
  initialRadiusKm = 15,
  onRadiusChange,
  className = '',
}) => {
  const { userLocation, setUserLocation, openTaskDetails, language } = useAppStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circleRadiusRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm);
  const [mapStyle, setMapStyle] = useState<'voyager' | 'osm'>('voyager');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const currentLat = centerLat ?? userLocation.latitude ?? 12.9815;
  const currentLng = centerLng ?? userLocation.longitude ?? 80.218;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const tileUrl =
      mapStyle === 'voyager'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      mapStyle === 'voyager'
        ? '&copy; <a href="https://carto.com/">CARTO</a>'
        : '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>';

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution,
    }).addTo(map);

    // Zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create Layers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // User Radius Circle (meter = radiusKm * 1000)
    const circle = L.circle([currentLat, currentLng], {
      radius: radiusKm * 1000,
      color: '#146B3A',
      fillColor: '#146B3A',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4 4',
    }).addTo(map);
    circleRadiusRef.current = circle;

    // User Custom Icon
    const userPulseIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:32px; height:32px; border-radius:9999px; background:rgba(20,107,58,0.3); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:16px; height:16px; border-radius:9999px; background:#146B3A; border:3px solid #FFFFFF; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker([currentLat, currentLng], {
      icon: userPulseIcon,
      zIndexOffset: 1000,
    }).addTo(map);
    userMarkerRef.current = userMarker;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapStyle]);

  // Sync center and radius circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([currentLat, currentLng]);
    }
    if (circleRadiusRef.current) {
      circleRadiusRef.current.setLatLng([currentLat, currentLng]);
      circleRadiusRef.current.setRadius(radiusKm * 1000);
    }
  }, [currentLat, currentLng, radiusKm]);

  // Update Task Markers
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    tasks.forEach((task) => {
      if (!task.location?.latitude || !task.location?.longitude) return;

      const cat = TASK_CATEGORIES.find((c) => c.id === task.category_id);
      const accentBg = cat?.accentColor || '#146B3A';

      // Custom quick-commerce pill marker
      const taskIcon = L.divIcon({
        className: 'custom-task-marker',
        html: `
          <div style="
            background:#146B3A;
            color:#FFFFFF;
            font-family:'Poppins', sans-serif;
            font-weight:900;
            font-size:11px;
            padding:3px 8px;
            border-radius:9999px;
            border:2px solid #FFFFFF;
            box-shadow:0 4px 10px rgba(0,0,0,0.25);
            display:flex;
            align-items:center;
            gap:3px;
            cursor:pointer;
            transform:translate(-50%, -50%);
            white-space:nowrap;
            transition:transform 0.15s ease;
          ">
            <span style="font-size:10px;">⚡</span>
            <span>₹${task.budget_inr}</span>
          </div>
        `,
        iconSize: [60, 26],
        iconAnchor: [30, 13],
      });

      const marker = L.marker([task.location.latitude, task.location.longitude], {
        icon: taskIcon,
      });

      marker.on('click', () => {
        setActiveTask(task);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([
            task.location.latitude - 0.005,
            task.location.longitude,
          ]);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [tasks]);

  // Real GPS Geolocation Trigger
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({
          locality: 'My Current Location, Chennai',
          latitude,
          longitude,
        });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError('Unable to retrieve GPS coordinates. Defaulting to Chennai.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleRadiusSlider = (newKm: number) => {
    setRadiusKm(newKm);
    if (onRadiusChange) {
      onRadiusChange(newKm);
    }
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-neutral-200/90 shadow-card bg-neutral-100 flex flex-col select-none ${className}`}>
      {/* Realtime Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-[400px] sm:h-[460px] z-10"
      />

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Live Status Badge */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-200/80 shadow-quick text-xs font-heading font-black text-neutral-900 flex items-center gap-1.5 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-part-green animate-pulse" />
          <span>Realtime PostGIS Map</span>
          <span className="text-neutral-300">•</span>
          <span className="text-part-green">{tasks.length} live tasks</span>
        </div>

        {/* Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          title="Detect Current Location (GPS)"
          className={`w-9 h-9 rounded-2xl bg-white shadow-quick border border-neutral-200 flex items-center justify-center text-neutral-700 hover:text-part-green active:scale-95 transition pointer-events-auto cursor-pointer ${
            isLocating ? 'animate-spin text-part-green' : ''
          }`}
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {locationError && (
        <div className="absolute top-14 left-3 right-3 z-20 bg-amber-50 text-amber-900 border border-amber-200 text-xs px-3 py-1.5 rounded-xl shadow-sm text-center">
          {locationError}
        </div>
      )}

      {/* Radius Controls Bar */}
      <div className="absolute top-13 left-3 z-20 pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-neutral-200 shadow-xs text-xs">
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
          Radius:
        </span>
        {[5, 10, 15, 25].map((km) => (
          <button
            key={km}
            type="button"
            onClick={() => handleRadiusSlider(km)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-heading font-black transition ${
              radiusKm === km
                ? 'bg-part-green text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {km}km
          </button>
        ))}
      </div>

      {/* Map Style Toggle */}
      <div className="absolute bottom-4 right-3 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => setMapStyle(mapStyle === 'voyager' ? 'osm' : 'voyager')}
          className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-neutral-200 shadow-quick text-[11px] font-heading font-bold text-neutral-700 hover:text-part-green flex items-center gap-1 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-part-green" />
          <span>{mapStyle === 'voyager' ? 'Clean' : 'Streets'}</span>
        </button>
      </div>

      {/* Active Task Bottom Preview Sheet */}
      {activeTask && (
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
              className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 font-bold text-xs flex items-center justify-center shrink-0"
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
                openTaskDetails(activeTask.id);
                setActiveTask(null);
              }}
              className="px-3.5 py-1.5 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-xl shadow-green flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            >
              <span>{language === 'ta' ? 'விவரம்' : 'View Task'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
