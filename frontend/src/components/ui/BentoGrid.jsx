import React from 'react';

export function BentoGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 max-w-7xl mx-auto ${className}`}>
      {children}
    </div>
  );
}

export function BentoCard({
  title,
  description,
  header,
  icon: Icon,
  badge,
  className = '',
  children
}) {
  return (
    <div
      className={`rounded-2xl p-6 md:p-7 border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-900 shadow-sm flex flex-col justify-between overflow-hidden relative transition-all duration-300 hover:-translate-y-0.5 ${className}`}
    >
      <div>
        {/* Header / Interactive Preview Slot */}
        {header && (
          <div className="mb-5 overflow-hidden rounded-xl border border-paper-200 dark:border-ink-800 bg-paper-50 dark:bg-charcoal-950">
            {header}
          </div>
        )}

        {/* Top Icon & Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-paper-200 dark:border-ink-700 text-accent flex items-center justify-center shadow-xs">
              <Icon className="w-5 h-5" />
            </div>
          )}
          {badge && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-charcoal-800 border border-paper-300 dark:border-ink-700 text-ink-700 dark:text-ink-300">
              {badge}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base sm:text-lg font-bold text-ink-950 dark:text-ink-100 tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Children content (e.g. action links, tags, micro-stats) */}
      {children && (
        <div className="mt-5 pt-4 border-t border-paper-200 dark:border-ink-800 text-xs text-ink-600 dark:text-ink-300">
          {children}
        </div>
      )}
    </div>
  );
}
