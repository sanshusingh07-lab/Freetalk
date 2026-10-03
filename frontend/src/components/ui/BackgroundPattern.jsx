import React from 'react';

export function BackgroundPattern({ variant = 'grid', className = '' }) {
  const patternClass = variant === 'dots' ? 'bg-dot-slate' : 'bg-grid-slate';

  return (
    <div className={`absolute inset-0 pointer-events-none -z-10 overflow-hidden ${className}`}>
      {/* 21st.dev Ambient Glowing Beams / Blur Orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-cyan-400/15 rounded-full blur-[120px] opacity-70" />
      <div className="absolute top-[600px] -left-40 w-[450px] h-[450px] bg-indigo-900/10 rounded-full blur-[100px]" />
      <div className="absolute top-[900px] -right-40 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[110px]" />

      {/* SVG Pattern with Radial Center Mask */}
      <div className={`w-full h-full ${patternClass} mask-radial-fade opacity-60`} />
    </div>
  );
}
