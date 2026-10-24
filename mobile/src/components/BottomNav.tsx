import React from 'react';
import { useAppStore, AppTab } from '../store/useAppStore';
import { Home, Compass, GraduationCap, Clock, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setTab, language } = useAppStore();

  const labels = {
    home: language === 'ta' ? 'முகப்பு' : 'Home',
    explore: language === 'ta' ? 'தேடுக' : 'Explore',
    campus: language === 'ta' ? 'வளாகம்' : 'Campus',
    activity: language === 'ta' ? 'என் பணிகள்' : 'My Tasks',
    profile: language === 'ta' ? 'சுயவிவரம்' : 'Profile',
  };

  const tabs: { key: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'home', label: labels.home, icon: Home },
    { key: 'explore', label: labels.explore, icon: Compass },
    { key: 'campus', label: labels.campus, icon: GraduationCap },
    { key: 'activity', label: labels.activity, icon: Clock },
    { key: 'profile', label: labels.profile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-white/95 backdrop-blur-md border-t border-neutral-200/90 px-3 sm:px-6 md:px-8 py-1 sm:py-1.5 flex items-center justify-around z-40 shadow-sticky select-none pointer-events-auto transition-[max-width] duration-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.key;
        const isCampus = tab.key === 'campus';

        return (
          <button
            id={`nav-tab-${tab.key}`}
            key={tab.key}
            type="button"
            onClick={() => setTab(tab.key)}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
              isActive
                ? 'text-part-green font-extrabold'
                : 'text-neutral-400 hover:text-neutral-700 font-semibold'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                isActive ? 'bg-part-green-mint text-part-green scale-105' : ''
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className="text-[9.5px] font-heading tracking-wider mt-0.5 uppercase">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
