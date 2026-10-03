import React, { useState } from 'react';
import { pollService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CheckCircle2, Lock } from 'lucide-react';

export function PollWidget({ poll, onVoteSuccess }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState(poll?.userVotedOptionId || null);
  const [hasVoted, setHasVoted] = useState(Boolean(poll?.userVotedOptionId));
  const [options, setOptions] = useState(poll?.options || []);
  const [totalVotes, setTotalVotes] = useState(poll?.totalVotes || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!poll) return null;

  const handleVote = async (optionId) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to cast your anonymous vote.");
      return;
    }

    if (hasVoted) return;

    try {
      setIsSubmitting(true);
      const res = await pollService.vote(poll.id, optionId);
      if (res.data.success) {
        setSelectedOption(optionId);
        setHasVoted(true);
        setTotalVotes(res.data.poll.totalVotes);
        setOptions(res.data.poll.options);
        toast.success("Vote recorded anonymously.");
        if (onVoteSuccess) onVoteSuccess(res.data.poll);
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit vote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-4 p-4 rounded-xl bg-paper-50 dark:bg-charcoal-800/80 border border-paper-200 dark:border-charcoal-700 space-y-2.5">
      <div className="flex items-center justify-between text-xs text-ink-600 dark:text-ink-400 mb-1">
        <span className="font-semibold uppercase tracking-wider text-terracotta-700 dark:text-terracotta-400 font-mono text-[11px]">Anonymous Poll</span>
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-ink-500 dark:text-ink-400" />
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <div className="space-y-2">
        {options.map((opt) => {
          const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => !hasVoted && handleVote(opt.id)}
              disabled={hasVoted || isSubmitting}
              className={`relative w-full text-left p-3 rounded-xl border transition-all overflow-hidden ${
                isSelected 
                  ? 'border-terracotta-500 bg-terracotta-50/70 dark:bg-terracotta-950/40 text-terracotta-800 dark:text-terracotta-200 font-semibold shadow-sm' 
                  : 'border-paper-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-850 hover:border-paper-300 dark:hover:border-charcoal-600 text-ink-800 dark:text-ink-200'
              } ${hasVoted ? 'cursor-default' : 'hover:scale-[1.005] active:scale-[0.995]'}`}
            >
              {/* Animated fill bar when voted */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out opacity-25 ${
                    isSelected ? 'bg-terracotta-500' : 'bg-paper-300 dark:bg-charcoal-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between z-10 text-sm">
                <span className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400 shrink-0" />}
                  <span>{opt.text}</span>
                </span>
                {hasVoted && (
                  <span className="text-xs font-mono font-medium text-ink-600 dark:text-ink-300">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
