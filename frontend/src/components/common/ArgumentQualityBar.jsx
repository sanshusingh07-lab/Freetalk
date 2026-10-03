import React, { useState } from 'react';
import { qualityService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const QUALITY_TAGS = [
  { tag: 'WELL_EXPLAINED', label: 'Well explained', icon: '🧠', bg: 'hover:border-purple-500/40' },
  { tag: 'EVIDENCE_PROVIDED', label: 'Evidence provided', icon: '🔬', bg: 'hover:border-cyan-500/40' },
  { tag: 'RESPECTFUL', label: 'Respectful tone', icon: '🤝', bg: 'hover:border-emerald-500/40' },
  { tag: 'USEFUL_PERSPECTIVE', label: 'Useful perspective', icon: '💡', bg: 'hover:border-amber-500/40' }
];

export function ArgumentQualityBar({ targetType, targetId, initialQuality = {}, onUpdate }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [quality, setQuality] = useState({
    WELL_EXPLAINED: initialQuality.WELL_EXPLAINED || 0,
    EVIDENCE_PROVIDED: initialQuality.EVIDENCE_PROVIDED || 0,
    RESPECTFUL: initialQuality.RESPECTFUL || 0,
    USEFUL_PERSPECTIVE: initialQuality.USEFUL_PERSPECTIVE || 0,
    totalVotes: initialQuality.totalVotes || 0,
    userVotedTags: initialQuality.userVotedTags || []
  });
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (tag) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to rate argument quality.");
      return;
    }

    try {
      setIsVoting(true);
      const res = await qualityService.voteQuality({
        targetType,
        targetId,
        qualityTag: tag
      });

      if (res.data.success) {
        setQuality(res.data.quality);
        if (onUpdate) onUpdate(res.data.quality);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to submit quality feedback.");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-medium text-ink-600 dark:text-ink-300 flex items-center gap-1">
          <span>🧠 Argument Quality:</span>
          <span className="text-ink-400 dark:text-ink-400 text-[10px] hidden sm:inline">(Rewarding constructive reasoning, not popularity)</span>
        </span>
        {quality.totalVotes > 0 && (
          <span className="text-[10px] font-mono text-terracotta-700 dark:text-terracotta-300 bg-terracotta-50 dark:bg-terracotta-950/40 px-1.5 py-0.5 rounded border border-terracotta-200 dark:border-terracotta-800/40">
            {quality.totalVotes} quality {quality.totalVotes === 1 ? 'endorsement' : 'endorsements'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUALITY_TAGS.map(({ tag, label, icon }) => {
          const count = quality[tag] || 0;
          const isSelected = quality.userVotedTags?.includes(tag);

          return (
            <button
              key={tag}
              type="button"
              disabled={isVoting}
              onClick={() => handleVote(tag)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border ${
                isSelected
                  ? 'bg-terracotta-50 dark:bg-terracotta-950/50 border-terracotta-500 text-terracotta-700 dark:text-terracotta-300 font-semibold shadow-sm'
                  : 'bg-paper-50 dark:bg-charcoal-800 border-paper-200 dark:border-charcoal-700 text-ink-700 dark:text-ink-200 hover:text-ink-900 dark:hover:text-white hover:border-paper-300 dark:hover:border-charcoal-600'
              }`}
              title={`Endorse argument as: ${label}`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {count > 0 && (
                <span className={`text-[10px] font-mono ml-0.5 px-1 rounded ${
                  isSelected ? 'bg-terracotta-100 dark:bg-terracotta-900/60 text-terracotta-800 dark:text-terracotta-200' : 'bg-paper-200 dark:bg-charcoal-700 text-ink-600 dark:text-ink-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
