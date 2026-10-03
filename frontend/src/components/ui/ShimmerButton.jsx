import React from 'react';

export function ShimmerButton({
  children,
  onClick,
  className = '',
  icon: Icon,
  shimmerColor = '#818cf8',
  ...props
}) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl p-[1px] font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 active:scale-95 group ${className}`}
      {...props}
    >
      {/* Animated gradient spinning sweep border */}
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#312e81_0%,#818cf8_50%,#312e81_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Button content pill */}
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-[11px] bg-charcoal-900 dark:bg-charcoal-950 px-5 py-2.5 text-xs sm:text-sm font-semibold text-paper-50 backdrop-blur-3xl transition-colors hover:bg-charcoal-800">
        {Icon && <Icon className="w-4 h-4 text-terracotta-400 transition-colors" />}
        <span>{children}</span>
      </span>
    </button>
  );
}
