import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { PlusCircle, Compass, ArrowRight, Zap, Coins } from 'lucide-react';

export const QuickActionCard: React.FC = () => {
  const { setTab, language } = useAppStore();

  return (
    <div className="grid grid-cols-2 gap-3 select-none">
      {/* Tile 1: I NEED HELP */}
      <div
        onClick={() => setTab('post')}
        className="bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/80 p-4 rounded-3xl shadow-quick cursor-pointer hover:shadow-card transition-all active:scale-[0.98] flex flex-col justify-between h-38 group relative overflow-hidden"
      >
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-brand-yellow/20 rounded-full blur-lg group-hover:scale-125 transition-transform" />
        
        <div>
          <div className="w-9 h-9 rounded-2xl bg-brand-yellow text-neutral-900 flex items-center justify-center mb-2.5 shadow-xs group-hover:rotate-6 transition-transform">
            <Zap className="w-5 h-5 fill-neutral-900" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
            {language === 'ta' ? 'உதவி வேண்டும்' : 'I NEED HELP'}
          </span>
          <h3 className="font-heading font-black text-sm text-neutral-900 leading-tight mt-0.5">
            {language === 'ta' ? 'நிமிடங்களில் பணி பதிவு செய்க' : 'Post a task in minutes.'}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1 text-xs font-heading font-extrabold text-neutral-900 group-hover:underline">
            <span>{language === 'ta' ? 'பணி பதிவு' : 'Post Task'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
          <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center">
            <PlusCircle className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Tile 2: I WANT TO EARN */}
      <div
        onClick={() => setTab('explore')}
        className="bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/80 p-4 rounded-3xl shadow-quick cursor-pointer hover:shadow-card transition-all active:scale-[0.98] flex flex-col justify-between h-38 group relative overflow-hidden"
      >
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-part-green/20 rounded-full blur-lg group-hover:scale-125 transition-transform" />

        <div>
          <div className="w-9 h-9 rounded-2xl bg-part-green text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:-rotate-6 transition-transform">
            <Coins className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-part-green-dark">
            {language === 'ta' ? 'வருவாய் ஈட்டலாம்' : 'I WANT TO EARN'}
          </span>
          <h3 className="font-heading font-black text-sm text-neutral-900 leading-tight mt-0.5">
            {language === 'ta' ? 'அருகிலுள்ள பணிகளை தேடுக' : 'Explore jobs around you.'}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1 text-xs font-heading font-extrabold text-part-green-dark group-hover:underline">
            <span>{language === 'ta' ? 'பணிகள் காண்க' : 'Find Tasks'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
          <div className="w-6 h-6 rounded-full bg-part-green text-white flex items-center justify-center">
            <Compass className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
