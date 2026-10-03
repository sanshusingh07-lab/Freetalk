import React from 'react';

export function SkeletonPost() {
  return (
    <div className="p-6 rounded-xl bg-surface border border-border animate-pulse space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-paper-200 dark:bg-charcoal-700" />
        <div className="space-y-1.5 flex-1">
          <div className="w-28 h-3.5 bg-paper-200 dark:bg-charcoal-700 rounded-md" />
          <div className="w-16 h-2.5 bg-paper-100 dark:bg-charcoal-800 rounded-md" />
        </div>
      </div>
      <div className="w-3/4 h-5 bg-paper-200 dark:bg-charcoal-700 rounded-md" />
      <div className="space-y-2">
        <div className="w-full h-3 bg-paper-100 dark:bg-charcoal-800 rounded-md" />
        <div className="w-5/6 h-3 bg-paper-100 dark:bg-charcoal-800 rounded-md" />
      </div>
      <div className="flex gap-4 pt-2 border-t border-border">
        <div className="w-14 h-6 bg-paper-200 dark:bg-charcoal-700 rounded-lg" />
        <div className="w-14 h-6 bg-paper-200 dark:bg-charcoal-700 rounded-lg" />
        <div className="w-14 h-6 bg-paper-200 dark:bg-charcoal-700 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTopic() {
  return (
    <div className="p-5 rounded-xl bg-surface border border-border animate-pulse flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-lg bg-paper-200 dark:bg-charcoal-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-4 bg-paper-200 dark:bg-charcoal-700 rounded" />
        <div className="w-full h-3 bg-paper-100 dark:bg-charcoal-800 rounded" />
      </div>
    </div>
  );
}
