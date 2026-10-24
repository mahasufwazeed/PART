import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CHENNAI_LOCALITIES } from '@part/shared';
import { MapPin, ChevronDown, User, Globe, Check } from 'lucide-react';
import { LocationSelectorModal } from './LocationSelectorModal';


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

      {/* Full Blinkit-style Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </>
  );
};
