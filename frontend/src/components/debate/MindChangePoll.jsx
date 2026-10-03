import React, { useState } from 'react';
import { featureService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Sparkles, Check } from 'lucide-react';

const CHOICES = [
  { id: 'YES', label: 'Yes, changed my mind', icon: '🟢', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'A_LITTLE', label: 'Broadened my view', icon: '🟡', color: 'from-amber-500 to-yellow-600', text: 'text-amber-700 dark:text-amber-300' },
  { id: 'NO', label: 'No, position unchanged', icon: '⚪', color: 'from-slate-500 to-slate-600', text: 'text-ink-700 dark:text-ink-300' },
  { id: 'STILL_THINKING', label: 'Still contemplating', icon: '🟣', color: 'from-olive-500 to-olive-600', text: 'text-olive-700 dark:text-olive-300' }
];

export function MindChangePoll({ targetType = 'POST', targetId, initialStats = {}, onUpdate }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    YES: initialStats.YES || 0,
    A_LITTLE: initialStats.A_LITTLE || 0,
    NO: initialStats.NO || 0,
    STILL_THINKING: initialStats.STILL_THINKING || 0,
    totalVotes: initialStats.totalVotes || 0,
    userVoted: initialStats.userVoted || null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (choice) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to participate in the opinion poll.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await featureService.voteMindChange({
        targetType,
        targetId,
        opinionChange: choice
      });

      if (res.data.success) {
        setStats(res.data.stats);
        toast.success("Opinion shift recorded anonymously.");
        if (onUpdate) onUpdate(res.data.stats);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to record vote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatePct = (count) => {
    if (!stats.totalVotes || stats.totalVotes === 0) return 0;
    return Math.round((count / stats.totalVotes) * 100);
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>What Changed My Mind?</span>
            <span className="text-[10px] font-mono uppercase bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 px-2 py-0.5 rounded-full border border-terracotta-200 dark:border-terracotta-800/40">
              Intellectual Honesty
            </span>
          </h4>
          <p className="text-xs text-ink-600 dark:text-ink-300 mt-1">
            Did reading these arguments expand or alter your original perspective?
          </p>
        </div>

        {stats.totalVotes > 0 && (
          <span className="text-[11px] font-mono text-ink-600 dark:text-ink-300 bg-paper-100 dark:bg-charcoal-800 px-2 py-1 rounded-lg border border-paper-200 dark:border-charcoal-700 whitespace-nowrap">
            {stats.totalVotes} {stats.totalVotes === 1 ? 'reflection' : 'reflections'}
          </span>
        )}
      </div>

      {/* Choice Buttons & Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CHOICES.map(({ id, label, icon, color, text }) => {
          const count = stats[id] || 0;
          const pct = calculatePct(count);
          const isSelected = stats.userVoted === id;

          return (
            <button
              key={id}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleVote(id)}
              className={`relative overflow-hidden text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/40 shadow-sm ring-1 ring-terracotta-500/50'
                  : 'border-paper-200 dark:border-charcoal-700 bg-paper-50 dark:bg-charcoal-800 hover:border-paper-300 dark:hover:border-charcoal-600'
              }`}
            >
              {/* Background progress fill if votes exist */}
              {stats.totalVotes > 0 && (
                <div
                  className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${color} opacity-15 transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className={`text-xs font-medium ${isSelected ? 'text-terracotta-700 dark:text-terracotta-300 font-semibold' : 'text-ink-800 dark:text-ink-200'}`}>
                    {label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400" />}
                </div>

                {stats.totalVotes > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-ink-500 dark:text-ink-400 font-mono">({count})</span>
                    <span className={`text-xs font-mono font-bold ${text}`}>{pct}%</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
