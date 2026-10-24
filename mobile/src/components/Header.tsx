import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { MapPin, Bell, ShieldCheck, Search } from 'lucide-react';

interface Props {
  onSearchChange?: (val: string) => void;
  searchValue?: string;
}

export const Header: React.FC<Props> = ({ onSearchChange, searchValue = '' }) => {
  const { currentProfile, userLocation, language } = useAppStore();

  const greeting =
    language === 'ta'
      ? 'வணக்கம்!'
      : 'Good morning!';

  const subtitle =
    language === 'ta'
      ? 'உடனடி உதவி அல்லது வருமானம் பெறுங்கள்.'
      : 'Find help or earn nearby.';

  return (
    <div className="bg-gradient-to-br from-primary via-primaryDark to-slate-900 text-white p-4 rounded-b-3xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-base text-accent">
            {currentProfile.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-indigo-200">{greeting}</span>
              {currentProfile.verification_status === 'verified' && (
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              )}
            </div>
            <h2 className="text-base font-bold tracking-tight text-white">
              {currentProfile.full_name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span>{userLocation.locality}</span>
          </div>

          <button
            title="Notifications"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center relative hover:bg-white/20 transition"
          >
            <Bell className="w-4 h-4 text-white" />
            <span className="w-2 h-2 rounded-full bg-accent absolute top-2 right-2 ring-2 ring-primary"></span>
          </button>
        </div>
      </div>

      <p className="text-xs text-indigo-100/90 mb-3 font-normal">{subtitle}</p>

      {/* Modern Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder={
            language === 'ta'
              ? 'பணிகளைத் தேடுங்கள் (எ.கா. பார்சல், நகர்த்தல்)...'
              : 'Search nearby tasks (e.g. parcel pickup, furniture)...'
          }
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm pl-10 pr-4 py-2.5 rounded-xl shadow-inner border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  );
};
