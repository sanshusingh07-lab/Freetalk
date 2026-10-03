import React, { useState } from 'react';
import { featureService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Split, Check } from 'lucide-react';

export function IdeaVsIdeaWidget({ idea }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [votesA, setVotesA] = useState(idea.votesA || 0);
  const [votesB, setVotesB] = useState(idea.votesB || 0);
  const [userVotedOption, setUserVotedOption] = useState(idea.userVotedOption || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = votesA + votesB;
  const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50;
  const pctB = total > 0 ? Math.round((votesB / total) * 100) : 50;

  const handleVote = async (option) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to vote on opinions.");
      return;
    }
    if (userVotedOption) return;

    try {
      setIsSubmitting(true);
      const res = await featureService.voteIdea(idea.id, option);
      if (res.data.success) {
        setVotesA(res.data.votesA);
        setVotesB(res.data.votesB);
        setUserVotedOption(option);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit vote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl p-5 border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle mb-6">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-olive-700 dark:text-olive-400 mb-2">
        <Split className="w-4 h-4 text-olive-600 dark:text-olive-400" />
        <span>Idea vs. Idea Comparison</span>
      </div>

      <h4 className="text-base font-serif font-bold text-ink-900 dark:text-ink-100 mb-1">{idea.title}</h4>
      {idea.description && <p className="text-xs text-ink-600 dark:text-ink-300 mb-4">{idea.description}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Option A */}
        <button
          onClick={() => handleVote('A')}
          disabled={Boolean(userVotedOption) || isSubmitting}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            userVotedOption === 'A'
              ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/40 shadow-sm'
              : 'border-paper-200 dark:border-charcoal-700 bg-paper-50 dark:bg-charcoal-800 hover:border-paper-300 dark:hover:border-charcoal-600'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-terracotta-700 dark:text-terracotta-400 mb-1">
            <span>Option A</span>
            {userVotedOption === 'A' && <Check className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400" />}
          </div>
          <div className="text-xs font-semibold text-ink-900 dark:text-ink-100 mb-1">{idea.optionATitle}</div>
          <div className="text-[11px] text-ink-600 dark:text-ink-300 leading-relaxed">{idea.optionADesc}</div>
          {userVotedOption && (
            <div className="mt-2 text-xs font-mono font-bold text-terracotta-700 dark:text-terracotta-300">{pctA}%</div>
          )}
        </button>

        {/* Option B */}
        <button
          onClick={() => handleVote('B')}
          disabled={Boolean(userVotedOption) || isSubmitting}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            userVotedOption === 'B'
              ? 'border-olive-500 bg-olive-50 dark:bg-olive-950/40 shadow-sm'
              : 'border-paper-200 dark:border-charcoal-700 bg-paper-50 dark:bg-charcoal-800 hover:border-paper-300 dark:hover:border-charcoal-600'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-olive-700 dark:text-olive-400 mb-1">
            <span>Option B</span>
            {userVotedOption === 'B' && <Check className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />}
          </div>
          <div className="text-xs font-semibold text-ink-900 dark:text-ink-100 mb-1">{idea.optionBTitle}</div>
          <div className="text-[11px] text-ink-600 dark:text-ink-300 leading-relaxed">{idea.optionBDesc}</div>
          {userVotedOption && (
            <div className="mt-2 text-xs font-mono font-bold text-olive-700 dark:text-olive-300">{pctB}%</div>
          )}
        </button>
      </div>

      {userVotedOption && (
        <div className="h-1.5 w-full rounded-full bg-paper-200 dark:bg-charcoal-700 overflow-hidden flex">
          <div className="bg-terracotta-500 transition-all duration-500" style={{ width: `${pctA}%` }} />
          <div className="bg-olive-500 transition-all duration-500" style={{ width: `${pctB}%` }} />
        </div>
      )}
    </div>
  );
}
