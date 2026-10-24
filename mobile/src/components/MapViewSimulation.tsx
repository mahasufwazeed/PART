import React, { useState } from 'react';
import { Task } from '@part/shared';
import { useAppStore } from '../store/useAppStore';
import { MapPin, Navigation, IndianRupee, Layers } from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const MapViewSimulation: React.FC<Props> = ({ tasks }) => {
  const { userLocation, openTaskDetails, language } = useAppStore();
  const [activeTaskPreview, setActiveTaskPreview] = useState<Task | null>(null);

  // Map coordinate normalization for Chennai viewport
  // Lat range: 12.85 to 13.15 -> height
  // Lng range: 80.05 to 80.32 -> width
  const toSvgX = (lng: number) => {
    return Math.max(5, Math.min(95, ((lng - 80.05) / 0.27) * 100));
  };

  const toSvgY = (lat: number) => {
    // Invert Y for screen coords
    return Math.max(5, Math.min(95, (1 - (lat - 12.85) / 0.3) * 100));
  };

  const userX = toSvgX(userLocation.longitude);
  const userY = toSvgY(userLocation.latitude);

  return (
    <div className="relative w-full h-[400px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-inner flex flex-col justify-between p-3 select-none">
      {/* Background Chennai Map Canvas */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bayOfBengal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#2563EB" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Chennai East Coastline & Bay of Bengal */}
        <path
          d="M 85,0 Q 82,30 84,60 Q 88,85 86,100 L 100,100 L 100,0 Z"
          fill="url(#bayOfBengal)"
        />

        {/* Grid lines */}
        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
        <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
        <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />

        {/* Radar search radius around user */}
        <circle
          cx={`${userX}%`}
          cy={`${userY}%`}
          r="28%"
          fill="url(#radarPulse)"
          className="animate-pulse"
        />
        <circle
          cx={`${userX}%`}
          cy={`${userY}%`}
          r="28%"
          fill="none"
          stroke="#2563eb"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Major Localities Labels */}
        <text x="82%" y="15%" fill="#38bdf8" fontSize="10" fontWeight="bold">Bay of Bengal</text>
        <text x="45%" y="30%" fill="#94a3b8" fontSize="9">Anna Nagar</text>
        <text x="56%" y="48%" fill="#94a3b8" fontSize="9">T. Nagar</text>
        <text x="52%" y="68%" fill="#94a3b8" fontSize="9">Velachery</text>
        <text x="68%" y="78%" fill="#94a3b8" fontSize="9">OMR (IT)</text>
      </svg>

      {/* Map Control Overlay */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white flex items-center gap-1.5 shadow">
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span className="font-semibold">Chennai Map Layer (Live)</span>
        </div>

        <div className="bg-slate-800/90 text-slate-300 text-[11px] px-2 py-0.5 rounded-full border border-slate-700">
          {tasks.length} tasks nearby
        </div>
      </div>

      {/* User Current Location Dot */}
      <div
        style={{ left: `${userX}%`, top: `${userY}%` }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <div className="relative flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent border-2 border-white shadow-lg"></span>
        </div>
        <div className="bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap mt-1 border border-accent/40 shadow">
          You are here
        </div>
      </div>

      {/* Task Markers */}
      {tasks.map((task) => {
        if (!task.location) return null;
        const x = toSvgX(task.location.longitude);
        const y = toSvgY(task.location.latitude);

        return (
          <div
            key={task.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => setActiveTaskPreview(task)}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group hover:z-30 transition-transform"
          >
            <div className="flex items-center gap-1 bg-primary text-white text-[11px] font-extrabold px-2 py-1 rounded-full shadow-lg border-2 border-white group-hover:scale-110 group-hover:bg-secondary transition">
              <MapPin className="w-3 h-3 text-accent" />
              <span>₹{task.budget_inr}</span>
            </div>
          </div>
        );
      })}

      {/* Task Preview Popup Modal */}
      {activeTaskPreview && (
        <div className="relative z-30 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl mt-auto">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {activeTaskPreview.location?.locality}
              </span>
              <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                {activeTaskPreview.title}
              </h4>
            </div>
            <button
              onClick={() => setActiveTaskPreview(null)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-sm font-extrabold text-slate-900">
              ₹{activeTaskPreview.budget_inr}
            </span>
            <button
              onClick={() => {
                openTaskDetails(activeTaskPreview.id);
                setActiveTaskPreview(null);
              }}
              className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primaryDark transition"
            >
              {language === 'ta' ? 'பணி விவரம்' : 'View Task'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
