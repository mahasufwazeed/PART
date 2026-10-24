import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CHENNAI_LOCALITIES } from '@part/shared';
import { User, Globe, MapPin, LogOut } from 'lucide-react';

export const UserAccountBar: React.FC = () => {
  const {
    currentProfile,
    language,
    userLocation,
    setLanguage,
    setUserLocation,
    logout,
  } = useAppStore();

  if (!currentProfile) return null;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-accent/20 text-accent font-black text-[10px] flex items-center justify-center">
          {currentProfile.full_name.charAt(0)}
        </div>
        <span className="font-bold text-slate-200">
          {currentProfile.full_name}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Locality Selector */}
        <div className="flex items-center gap-1 text-slate-300">
          <MapPin className="w-3 h-3 text-secondary-light" />
          <select
            value={userLocation.locality.split(',')[0]}
            onChange={(e) => {
              const loc = CHENNAI_LOCALITIES.find((l) => l.name === e.target.value);
              if (loc) {
                setUserLocation({
                  locality: `${loc.name}, Chennai`,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                });
              }
            }}
            className="bg-slate-800 text-white text-[11px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
          >
            {CHENNAI_LOCALITIES.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded p-0.5 border border-slate-700">
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              language === 'en' ? 'bg-primary text-white' : 'text-slate-400'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              language === 'ta' ? 'bg-accent text-slate-950' : 'text-slate-400'
            }`}
          >
            தமிழ்
          </button>
        </div>

        {/* Sign Out */}
        <button
          onClick={logout}
          title="Sign Out"
          className="text-slate-400 hover:text-rose-400 transition ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
