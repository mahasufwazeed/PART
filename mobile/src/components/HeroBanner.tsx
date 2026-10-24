import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { PlusCircle, Search, Sparkles, ShieldCheck } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { setTab, language } = useAppStore();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-yellow via-amber-200 to-amber-100 rounded-3xl p-5 border border-brand-yellow/30 shadow-card text-brand-dark select-none">
      {/* Background Decorative Rings */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-part-green/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Text Content */}
        <div className="flex-1 space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-dark/10 text-brand-dark text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-part-green" />
            <span>Chennai Hyperlocal Marketplace</span>
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-3xl leading-[1.15] text-neutral-950">
            {language === 'ta' ? (
              <>
                உங்கள் அக்கம் பக்கம்.<br />
                உதவும் நல்ல மனிதர்கள்.
              </>
            ) : (
              <>
                Your neighborhood.<br />
                Your helping hands.
              </>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-800/90 font-medium max-w-sm">
            {language === 'ta'
              ? 'அருகிலுள்ள நம்பகமான நபர்களுடன் பணிகளை உடனடியாக முடியுங்கள்.'
              : 'Get things done with trusted, verified people nearby.'}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setTab('post')}
              className="px-4 py-2.5 bg-part-green hover:bg-part-green-dark text-white font-heading font-bold text-xs rounded-xl shadow-green hover:shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'ta' ? 'பணி பதிவு செய்க' : 'Post a Task'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('explore')}
              className="px-4 py-2.5 bg-white/90 hover:bg-white text-neutral-900 font-heading font-bold text-xs rounded-xl border border-neutral-300/80 shadow-xs hover:shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4 text-part-green" />
              <span>{language === 'ta' ? 'பணி தேடுக' : 'Find Work'}</span>
            </button>
          </div>
        </div>

        {/* Original Illustrated Helping-Hands Graphic */}
        <div className="w-40 h-32 sm:w-48 sm:h-36 shrink-0 relative flex items-center justify-center">
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Friendly Sun / Circle */}
            <circle cx="100" cy="75" r="55" fill="#FFFFFF" fillOpacity="0.4" />
            
            {/* Ground line */}
            <path d="M20 125 C 70 120, 130 120, 180 125" stroke="#146B3A" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 3" opacity="0.3" />

            {/* Person 1 (Requester - left) */}
            <circle cx="65" cy="55" r="14" fill="#146B3A" />
            <path d="M52 110 C 52 82, 78 82, 78 110 Z" fill="#146B3A" />
            {/* Smile / head feature */}
            <circle cx="62" cy="53" r="2" fill="#FFFFFF" />
            <circle cx="68" cy="53" r="2" fill="#FFFFFF" />
            
            {/* Person 2 (Helper / Worker - right) */}
            <circle cx="135" cy="55" r="14" fill="#171717" />
            <path d="M122 110 C 122 82, 148 82, 148 110 Z" fill="#171717" />
            <circle cx="132" cy="53" r="2" fill="#FFCC00" />
            <circle cx="138" cy="53" r="2" fill="#FFCC00" />

            {/* Helping Hands Handover Package */}
            <g transform="translate(86, 70)">
              <rect width="28" height="24" rx="5" fill="#FFCC00" stroke="#171717" strokeWidth="2" />
              <path d="M14 0 L14 24" stroke="#171717" strokeWidth="1.5" />
              <path d="M0 12 L28 12" stroke="#171717" strokeWidth="1.5" />
              {/* Star badge */}
              <circle cx="14" cy="12" r="5" fill="#146B3A" />
              <path d="M14 9 L15 11 L17 11.5 L15.5 13 L16 15 L14 14 L12 15 L12.5 13 L11 11.5 L13 11 Z" fill="#FFFFFF" />
            </g>

            {/* Connecting Arm lines */}
            <path d="M72 80 L88 78" stroke="#146B3A" strokeWidth="4" strokeLinecap="round" />
            <path d="M128 80 L112 78" stroke="#171717" strokeWidth="4" strokeLinecap="round" />

            {/* Floating verification shield */}
            <g transform="translate(142, 25)">
              <rect width="20" height="20" rx="6" fill="#146B3A" />
              <path d="M6 10 L9 13 L14 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
