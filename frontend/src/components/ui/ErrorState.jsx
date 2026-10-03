import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export function ErrorState({
  title = "Something went wrong.",
  description = "Your discussions are safe. Try again.",
  onRetry
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 my-6 rounded-xl bg-surface border border-rose-200 dark:border-rose-900/40 shadow-sm">
      <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 mb-3.5">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-ink-100 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-300 max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry} className="border-border text-ink-800 dark:text-ink-200 hover:border-ink-400">
          Retry
        </Button>
      )}
    </div>
  );
}
