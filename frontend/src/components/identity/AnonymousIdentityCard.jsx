import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar.jsx';
import { RefreshCw, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';

export function AnonymousIdentityCard({ 
  identity, 
  reputation = "🌱 Positive Contributor", 
  discussionsCount = 0, 
  repliesCount = 0,
  onRegenerate = null,
  isRegenerating = false
}) {
  if (!identity) return null;

  return (
    <div className="relative overflow-hidden rounded-xl p-6 border border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-850 shadow-card">
      <div className="flex flex-col items-center text-center">
        {/* Abstract Avatar */}
        <div className="relative mb-3.5 p-1 rounded-xl bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700">
          <Avatar
            seed={identity.avatarSeed}
            shape={identity.avatarShape}
            color={identity.avatarColor}
            size="xl"
          />
          {identity.identityType === 'TEMPORARY' && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-500 text-white rounded">
              Temp
            </span>
          )}
        </div>

        {/* Anonymous Name */}
        <h3 className="font-serif text-xl font-bold text-ink-900 dark:text-paper-100 tracking-tight flex items-center gap-2">
          {identity.displayName}
        </h3>

        {/* Reputation Badge */}
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-olive-50 text-olive-800 border border-olive-200 dark:bg-olive-950/60 dark:text-olive-300 dark:border-olive-800">
          <span>{reputation}</span>
        </div>

        {/* Community Activity Stats */}
        <div className="grid grid-cols-2 gap-3 w-full my-5 py-3.5 px-4 rounded-lg bg-paper-50 dark:bg-ink-800/50 border border-paper-200 dark:border-ink-700">
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-ink-900 dark:text-paper-100">{discussionsCount}</div>
            <div className="text-[10px] text-ink-500 dark:text-paper-400 uppercase tracking-wider font-mono">Discussions</div>
          </div>
          <div className="text-center border-l border-paper-200 dark:border-ink-700">
            <div className="text-lg font-bold font-mono text-ink-900 dark:text-paper-100">{repliesCount}</div>
            <div className="text-[10px] text-ink-500 dark:text-paper-400 uppercase tracking-wider font-mono">Replies</div>
          </div>
        </div>

        {/* Identity Actions */}
        <div className="flex items-center gap-2 w-full">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-paper-100 dark:bg-ink-800 hover:bg-paper-200 dark:hover:bg-ink-700 text-ink-700 dark:text-paper-200 border border-paper-200 dark:border-ink-700 transition-all active:scale-[0.98] disabled:opacity-50"
              title="Change your public alias"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          )}

          <Link
            to="/privacy-center"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-terracotta-50 dark:bg-terracotta-950/40 hover:bg-terracotta-100 dark:hover:bg-terracotta-950/70 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/60 transition-all active:scale-[0.98]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400" />
            <span>Privacy Score</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
