import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CHENNAI_LOCALITIES } from '@part/shared';
import { MapPin, ChevronDown, User, Globe, Check } from 'lucide-react';

interface PARTHeaderProps {
  onSearchClick?: () => void;
}

export const PARTHeader: React.FC<PARTHeaderProps> = () => {
  const {
    currentProfile,
    userLocation,
    setUserLocation,
    language,
    setLanguage,
    setTab,
  } = useAppStore();

  const [showLocationModal, setShowLocationModal] = useState(false);

  const currentLocalityName = userLocation.locality.split(',')[0].trim();

  return (
    <>
      <header className="bg-brand-yellow text-brand-dark px-4 pt-3.5 pb-3 shadow-sm select-none">
        {/* Top Utility Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Logo & Tagline Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setTab('home')}>
              <div className="w-8 h-8 rounded-xl bg-brand-dark text-brand-yellow font-heading font-black text-lg flex items-center justify-center shadow-sm">
                P
              </div>
              <div>
                <span className="font-heading font-black text-xl tracking-tight leading-none block">
                  PART
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-800/80 block -mt-0.5">
                  People At Right Time
                </span>
              </div>
            </div>

            <span className="bg-brand-dark/10 text-brand-dark text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-brand-dark/10 hidden sm:inline-block">
              HELP NEAR YOU
            </span>
          </div>

          {/* Right Action Items: Language Toggle & Profile Avatar */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-brand-dark/10 rounded-full p-0.5 border border-brand-dark/10">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition ${
                  language === 'en'
                    ? 'bg-brand-dark text-brand-yellow shadow-xs'
                    : 'text-brand-dark/80 hover:text-brand-dark'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition ${
                  language === 'ta'
                    ? 'bg-brand-dark text-brand-yellow shadow-xs'
                    : 'text-brand-dark/80 hover:text-brand-dark'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Profile Avatar */}
            <button
              type="button"
              onClick={() => setTab('profile')}
              aria-label="View Profile"
              className="w-8 h-8 rounded-full bg-white text-brand-dark flex items-center justify-center font-bold text-xs shadow-xs border-2 border-brand-dark/20 hover:scale-105 active:scale-95 transition-transform"
            >
              {currentProfile?.full_name ? (
                currentProfile.full_name.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4 text-brand-dark" />
              )}
            </button>
          </div>
        </div>

        {/* Location Dropdown Row */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1.5 text-left group hover:opacity-90 active:scale-[0.99] transition"
          >
            <div className="w-5 h-5 rounded-full bg-part-green text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-3 h-3 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-heading font-black text-sm tracking-tight text-neutral-900 group-hover:underline">
                  {currentLocalityName}, Chennai
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-800 transition-transform group-hover:translate-y-0.5" />
              </div>
              <p className="text-[11px] font-medium text-neutral-800/80 -mt-0.5">
                {language === 'ta'
                  ? 'உங்கள் அண்டை பகுதியில் உதவிகளை கண்டறியுங்கள்'
                  : 'Find help around your neighborhood'}
              </p>
            </div>
          </button>
        </div>
      </header>

      {/* Chennai Neighborhood Picker Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-heading font-black text-base text-neutral-900">
                  {language === 'ta' ? 'இருப்பிடத்தை தேர்வு செய்க' : 'Select Your Neighborhood'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {language === 'ta'
                    ? 'சென்னையின் முக்கிய இடங்கள்'
                    : 'Discover tasks & helpers within 10-15km of your area'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-neutral-100 py-2 flex-1">
              {CHENNAI_LOCALITIES.map((loc) => {
                const isSelected = currentLocalityName === loc.name;
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      setUserLocation({
                        locality: `${loc.name}, Chennai`,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                      });
                      setShowLocationModal(false);
                    }}
                    className={`w-full py-3 px-3 text-left flex items-center justify-between rounded-xl transition ${
                      isSelected
                        ? 'bg-brand-yellow-light text-neutral-950 font-bold'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin
                        className={`w-4 h-4 ${
                          isSelected ? 'text-part-green fill-part-green' : 'text-neutral-400'
                        }`}
                      />
                      <span className="text-xs font-semibold">{loc.name}, Chennai</span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-part-green text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
