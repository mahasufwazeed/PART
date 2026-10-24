import React from 'react';
import { useAppStore, AppTab } from '../store/useAppStore';
import { Home, Compass, PlusCircle, Clock, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setTab, language } = useAppStore();

  const labels = {
    home: language === 'ta' ? 'முகப்பு' : 'Home',
    explore: language === 'ta' ? 'தேடுக' : 'Explore',
    post: language === 'ta' ? 'பணி பதிவு' : 'Post',
    activity: language === 'ta' ? 'செயல்பாடு' : 'Activity',
    profile: language === 'ta' ? 'சுயவிவரம்' : 'Profile',
  };

  const tabs: { key: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'home', label: labels.home, icon: Home },
    { key: 'explore', label: labels.explore, icon: Compass },
    { key: 'post', label: labels.post, icon: PlusCircle },
    { key: 'activity', label: labels.activity, icon: Clock },
    { key: 'profile', label: labels.profile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around z-30 shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.key;
        const isPost = tab.key === 'post';

        if (isPost) {
          return (
            <button
              key={tab.key}
              onClick={() => setTab('post')}
              className="flex flex-col items-center -mt-5 group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center shadow-lg group-active:scale-95 transition-transform ring-4 ring-white">
                <PlusCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold text-primary mt-1">
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition ${
              isActive
                ? 'text-primary font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
