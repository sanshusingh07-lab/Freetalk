import React from 'react';

export function Avatar({ 
  seed = 'anon', 
  shape = 'geometric', 
  color = '#C45A3C', 
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28'
  };

  const dim = sizeClasses[size] || sizeClasses.md;

  // Simple deterministic hash from seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Earthy palette mapping
  const earthyAccents = ['#C45A3C', '#68735B', '#D99B43', '#8A9A86', '#A64B2A', '#566050', '#BF755A'];
  const accent1 = color || earthyAccents[Math.abs(hash) % earthyAccents.length];
  const accent2 = earthyAccents[(Math.abs(hash) + 2) % earthyAccents.length];

  const renderShape = () => {
    switch (shape) {
      case 'celestial':
        return (
          <g>
            {/* Background pill / disk */}
            <rect width="40" height="40" rx="10" fill="#F4F1EA" className="dark:fill-[#282724]" />
            {/* Soft moon halo */}
            <circle cx="20" cy="20" r="14" fill={accent1} fillOpacity="0.18" />
            {/* Crescent Moon */}
            <path
              d="M 16 10 A 11 11 0 0 0 28 26 A 13 13 0 0 1 16 10 Z"
              fill={accent1}
            />
            {/* Evening Star */}
            <polygon points="26,13 27.5,16 30.5,16.5 28,19 29,22 26,20 23,22 24,19 21.5,16.5 24.5,16" fill={accent2} />
          </g>
        );
      case 'organic':
        return (
          <g>
            <rect width="40" height="40" rx="10" fill="#F4F1EA" className="dark:fill-[#282724]" />
            {/* Botanical Sprout / Leaf Branch */}
            <path
              d="M 12 32 Q 18 24, 22 14 Q 24 22, 28 24"
              stroke={accent1}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Primary Leaf */}
            <path
              d="M 22 14 C 20 8, 30 6, 32 12 C 30 18, 24 18, 22 14 Z"
              fill={accent1}
            />
            {/* Secondary Bud */}
            <path
              d="M 16 24 C 11 21, 12 15, 17 18 C 19 20, 18 23, 16 24 Z"
              fill={accent2}
            />
          </g>
        );
      case 'elemental':
        return (
          <g>
            <rect width="40" height="40" rx="10" fill="#F4F1EA" className="dark:fill-[#282724]" />
            {/* Horizon Sun */}
            <circle cx="20" cy="18" r="8" fill={accent2} fillOpacity="0.8" />
            {/* Mountain Ridges */}
            <polygon points="20,13 32,31 8,31" fill={accent1} fillOpacity="0.9" />
            <polygon points="27,19 36,31 18,31" fill={accent1} fillOpacity="0.4" />
          </g>
        );
      case 'fractal':
        return (
          <g>
            <rect width="40" height="40" rx="10" fill="#F4F1EA" className="dark:fill-[#282724]" />
            {/* Origami Paper Crane Motif */}
            <polygon points="20,8 26,18 20,24 14,18" fill={accent1} />
            <polygon points="20,24 29,29 20,33 11,29" fill={accent2} fillOpacity="0.85" />
            <circle cx="20" cy="20" r="2.5" fill="#FFFFFF" />
          </g>
        );
      case 'geometric':
      default:
        return (
          <g>
            <rect width="40" height="40" rx="10" fill="#F4F1EA" className="dark:fill-[#282724]" />
            {/* Architectural Interlocking Circles */}
            <circle cx="18" cy="20" r="10" stroke={accent1} strokeWidth="2" fill="none" strokeOpacity="0.9" />
            <circle cx="22" cy="20" r="10" stroke={accent2} strokeWidth="2" fill="none" strokeOpacity="0.9" />
            <circle cx="20" cy="20" r="3" fill={accent1} />
          </g>
        );
    }
  };

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg border border-paper-200 dark:border-ink-700 transition-transform duration-200 hover:scale-105 shadow-subtle ${dim} ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderShape()}
      </svg>
    </div>
  );
}
