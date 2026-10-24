import React from 'react';

export interface PartLogoProps {
  variant?: 'full' | 'mark' | 'horizontal' | 'header';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDoodle?: boolean;
  doodleText?: string;
  className?: string;
  dark?: boolean;
}

export const PartLogoMark: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 rounded-xl p-1',
    md: 'w-11 h-11 rounded-2xl p-1.5',
    lg: 'w-14 h-14 rounded-2xl p-2',
    xl: 'w-16 h-16 rounded-[22px] p-2.5',
  };

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br from-[#0B1511] via-[#10291D] to-[#146B3A] shadow-md border border-emerald-500/20 shrink-0 ${sizeMap[size]} ${className}`}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="partGreenGrad" x1="14" y1="6" x2="38" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.65" stopColor="#E2E8F0" />
            <stop offset="1" stopColor="#A7F3D0" />
          </linearGradient>
          <linearGradient id="pinGrad" x1="22" y1="14" x2="30" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
          <filter id="pinGlow" x="18" y="10" width="16" height="16" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#10B981" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Custom Geometric P Body (Letter + Location Concept) */}
        <path
          d="M15 39V18.5C15 11.5964 20.5964 6 27.5 6C34.4036 6 40 11.5964 40 18.5C40 25.4036 34.4036 31 27.5 31H15"
          stroke="url(#partGreenGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Location Pin Core Center Dot */}
        <circle cx="27.5" cy="18.5" r="5" fill="url(#pinGrad)" filter="url(#pinGlow)" />
        <circle cx="27.5" cy="18.5" r="2" fill="#FFFFFF" opacity="0.9" />
      </svg>
    </div>
  );
};

export const PartLogo: React.FC<PartLogoProps> = ({
  variant = 'full',
  size = 'md',
  showDoodle = false,
  doodleText = '> Your Campus Helper',
  className = '',
  dark = false,
}) => {
  if (variant === 'mark') {
    return <PartLogoMark size={size} className={className} />;
  }

  const textColor = dark ? 'text-white' : 'text-[#0F172A]';
  const subtextColor = dark ? 'text-neutral-400' : 'text-neutral-600';

  const textSizes = {
    sm: { title: 'text-lg', sub: 'text-[7.5px]', tracking: 'tracking-[0.2em]' },
    md: { title: 'text-2xl', sub: 'text-[9.5px]', tracking: 'tracking-[0.22em]' },
    lg: { title: 'text-3xl sm:text-4xl', sub: 'text-[10px] sm:text-[11px]', tracking: 'tracking-[0.26em]' },
    xl: { title: 'text-4xl sm:text-5xl', sub: 'text-xs', tracking: 'tracking-[0.28em]' },
  }[size];

  return (
    <div className={`flex items-center justify-between flex-wrap gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <PartLogoMark size={size} />

        <div className="select-none">
          {/* Custom Bold PART Wordmark with Green Slash on 'R' */}
          <div className="flex items-baseline leading-none">
            <span className={`font-heading font-black tracking-tight ${textColor} ${textSizes.title}`}>
              PA
            </span>
            <span className={`font-heading font-black tracking-tight ${textColor} ${textSizes.title} relative inline-block`}>
              R
              <span className="absolute -bottom-0.5 right-0 w-2.5 h-1.5 bg-[#146B3A] rounded-full rotate-45 transform" />
            </span>
            <span className={`font-heading font-black tracking-tight ${textColor} ${textSizes.title}`}>
              T
            </span>
          </div>

          {/* Tagline: PEOPLE AT RIGHT TIME */}
          {(variant === 'full' || variant === 'header') && (
            <div
              className={`font-heading font-extrabold uppercase ${textSizes.sub} ${textSizes.tracking} ${subtextColor} block mt-0.5`}
            >
              People At Right Time
            </div>
          )}
        </div>
      </div>

      {/* Playful Handwritten Doodle */}
      {showDoodle && (
        <div className="flex items-center gap-1.5 text-[#146B3A] font-semibold text-xs sm:text-sm md:text-base italic tracking-tight select-none rotate-[-4deg] self-center">
          <span className="font-serif text-lg leading-none">&gt;</span>
          <span className="font-heading font-black">{doodleText}</span>
        </div>
      )}
    </div>
  );
};
