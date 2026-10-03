import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button.jsx';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 my-6 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-850 shadow-subtle">
      {Icon && (
        <div className="p-3.5 rounded-xl bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 text-terracotta-600 dark:text-terracotta-400 mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-paper-100 mb-1.5">{title}</h3>
      <p className="text-sm text-ink-500 dark:text-paper-400 max-w-sm mb-6 leading-relaxed font-sans">
        {description}
      </p>

      {actionText && (actionLink ? (
        <Link to={actionLink}>
          <Button variant="primary" size="sm">
            {actionText}
          </Button>
        </Link>
      ) : onAction ? (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      ) : null)}
    </div>
  );
}
