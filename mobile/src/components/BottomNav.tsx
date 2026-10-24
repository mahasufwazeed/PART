import React from 'react';
import { useAppStore, AppTab } from '../store/useAppStore';
import { Home, Compass, Plus, Clock, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setTab, language } = useAppStore();

  const labels = {
    home: language === 'ta' ? 'முகப்பு' : 'HOME',
    explore: language === 'ta' ? 'தேடுக' : 'EXPLORE',
    post: language === 'ta' ? 'பதிவு' : 'POST',
    activity: language === 'ta' ? 'செயல்பாடு' : 'ACTIVITY',
    profile: language === 'ta' ? 'சுயவிவரம்' : 'PROFILE',
  };

  const tabs: { key: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'home', label: labels.home, icon: Home },
    { key: 'explore', label: labels.explore, icon: Compass },
    { key: 'post', label: labels.post, icon: Plus },
    { key: 'activity', label: labels.activity, icon: Clock },
    { key: 'profile', label: labels.profile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-neutral-200/90 px-3 py-1.5 flex items-center justify-around z-40 shadow-sticky select-none pointer-events-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.key;
        const isPost = tab.key === 'post';

        if (isPost) {
          return (
            <button
              id="nav-tab-post"
              key={tab.key}
              type="button"
              onClick={() => setTab('post')}
              className="flex flex-col items-center -mt-6 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-brand-yellow text-neutral-950 flex items-center justify-center shadow-yellow group-hover:scale-105 active:scale-95 transition-transform ring-4 ring-white border border-brand-yellow-hover">
                <Plus className="w-7 h-7 stroke-[3]" />
              </div>
              <span className="text-[10px] font-heading font-black text-neutral-900 mt-1 uppercase tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        }

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
