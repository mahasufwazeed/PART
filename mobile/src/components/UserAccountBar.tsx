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
    currentTab,
  } = useAppStore();

  // On Home screen, PARTHeader already serves as the top brand bar
  if (!currentProfile || currentTab === 'home') return null;

  return (
    <div className="bg-white text-neutral-800 px-3 sm:px-5 md:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 shadow-xs select-none">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-brand-yellow text-neutral-950 font-heading font-black text-[10px] flex items-center justify-center">
          {currentProfile.full_name.charAt(0).toUpperCase()}
        </div>
        <span className="font-heading font-bold text-neutral-900 truncate max-w-[140px] sm:max-w-xs md:max-w-md">
          {currentProfile.full_name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Locality Selector */}
        <div className="flex items-center gap-1 text-neutral-600">
          <MapPin className="w-3 h-3 text-part-green" />
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
            className="bg-neutral-100 text-neutral-800 text-[11px] font-medium rounded-lg px-2 py-0.5 border border-neutral-200 focus:outline-none"
          >
            {CHENNAI_LOCALITIES.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200 text-[10px]">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.5 rounded font-bold transition ${
              language === 'en' ? 'bg-part-green text-white shadow-xs' : 'text-neutral-500'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`px-1.5 py-0.5 rounded font-bold transition ${
              language === 'ta' ? 'bg-part-green text-white shadow-xs' : 'text-neutral-500'
            }`}
          >
            தமிழ்
          </button>
        </div>
      </div>
    </div>
  );
};
