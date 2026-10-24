import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CHENNAI_LOCALITIES } from '@part/shared';
import { UserCheck, Globe, MapPin } from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const {
    currentProfile,
    language,
    userLocation,
    switchPersona,
    setLanguage,
    setUserLocation,
  } = useAppStore();

  return (
    <div className="bg-slate-900 text-white px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
      <div className="flex items-center gap-1.5">
        <UserCheck className="w-3.5 h-3.5 text-accent" />
        <span className="text-slate-400 font-medium">Persona:</span>
        <button
          onClick={() => switchPersona('requester')}
          className={`px-2 py-0.5 rounded font-medium transition ${
            currentProfile.id.includes('a1111')
              ? 'bg-primary text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Karthik (Requester)
        </button>
        <button
          onClick={() => switchPersona('worker')}
          className={`px-2 py-0.5 rounded font-medium transition ${
            currentProfile.id.includes('b2222')
              ? 'bg-accent text-slate-950 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Ananya (Worker)
        </button>
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
            className="bg-slate-800 text-white text-xs rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
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
          <Globe className="w-3 h-3 text-slate-400 ml-1" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
              language === 'en' ? 'bg-primary text-white' : 'text-slate-400'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
              language === 'ta' ? 'bg-accent text-slate-950' : 'text-slate-400'
            }`}
          >
            தமிழ்
          </button>
        </div>
      </div>
    </div>
  );
};
