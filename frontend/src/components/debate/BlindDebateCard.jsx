import React, { useState } from 'react';
import { featureService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { MindChangePoll } from './MindChangePoll.jsx';
import { Scale, CheckCircle2, UserCheck } from 'lucide-react';

export function BlindDebateCard({ debate }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [votesA, setVotesA] = useState(debate.votesA || 0);
  const [votesB, setVotesB] = useState(debate.votesB || 0);
  const [userVotedSide, setUserVotedSide] = useState(debate.userVotedSide || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = votesA + votesB;
  const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50;
  const pctB = total > 0 ? Math.round((votesB / total) * 100) : 50;

  const handleVote = async (side) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to cast your debate vote.");
      return;
    }
    if (userVotedSide) return;

    try {
      setIsSubmitting(true);
      const res = await featureService.voteDebate(debate.id, side);
      if (res.data.success) {
        setVotesA(res.data.votesA);
        setVotesB(res.data.votesB);
        setUserVotedSide(side);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to vote on debate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sideAAlias = debate.sideAAuthorAlias || "🅰️ Anonymous Raven";
  const sideBAlias = debate.sideBAuthorAlias || "🅱️ Anonymous Fox";

  return (
    <div className="rounded-xl p-6 border border-paper-200 dark:border-ink-800 mb-6 bg-white dark:bg-ink-850 space-y-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-terracotta-600 dark:text-terracotta-400 text-xs font-bold uppercase tracking-wider font-mono">
          <Scale className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
          <span>Blind Debate Arena</span>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-paper-100 dark:bg-ink-800 text-ink-700 dark:text-paper-300 font-medium border border-paper-200 dark:border-ink-700">
          {debate.category || "Civil Discourse"}
        </span>
      </div>

      <div>
        <h3 className="font-serif text-lg md:text-xl font-bold text-ink-900 dark:text-paper-100 mb-1.5 leading-snug">
          {debate.topic}
        </h3>
        <p className="text-xs text-ink-500 dark:text-paper-400 font-sans">
          Participants are assigned randomized blind identities. Weigh argument logic and empirical evidence rather than authority or identity.
        </p>
      </div>

      {/* Two Sides Comparison with Blind Aliases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Side A: Terracotta */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
          userVotedSide === 'A' 
            ? 'border-terracotta-500 bg-terracotta-50/50 dark:bg-terracotta-950/30' 
            : 'border-paper-200 dark:border-ink-700 bg-paper-50/50 dark:bg-ink-800/40'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-terracotta-700 dark:text-terracotta-300 mb-2 font-mono">
              <span className="flex items-center gap-1.5">
                <span>{sideAAlias}</span>
              </span>
              {userVotedSide === 'A' && <CheckCircle2 className="w-4 h-4 text-terracotta-600" />}
            </div>
            <h4 className="font-serif text-sm font-bold text-ink-900 dark:text-paper-100 mb-2">{debate.sideATitle}</h4>
            <p className="text-xs text-ink-700 dark:text-paper-200 leading-relaxed font-sans">{debate.sideAContent}</p>
          </div>

          <button
            onClick={() => handleVote('A')}
            disabled={Boolean(userVotedSide) || isSubmitting}
            className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              userVotedSide === 'A'
                ? 'bg-terracotta-600 text-white font-bold'
                : userVotedSide
                ? 'bg-paper-200 dark:bg-ink-800 text-ink-400 dark:text-paper-400 cursor-default'
                : 'bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-800 dark:bg-terracotta-950/40 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/60'
            }`}
          >
            {userVotedSide ? `${pctA}% support` : `Vote Argument A (${sideAAlias.split(' ')[1] || 'Alpha'})`}
          </button>
        </div>

        {/* Side B: Olive */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
          userVotedSide === 'B' 
            ? 'border-olive-500 bg-olive-50/50 dark:bg-olive-950/30' 
            : 'border-paper-200 dark:border-ink-700 bg-paper-50/50 dark:bg-ink-800/40'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-olive-700 dark:text-olive-300 mb-2 font-mono">
              <span className="flex items-center gap-1.5">
                <span>{sideBAlias}</span>
              </span>
              {userVotedSide === 'B' && <CheckCircle2 className="w-4 h-4 text-olive-600" />}
            </div>
            <h4 className="font-serif text-sm font-bold text-ink-900 dark:text-paper-100 mb-2">{debate.sideBTitle}</h4>
            <p className="text-xs text-ink-700 dark:text-paper-200 leading-relaxed font-sans">{debate.sideBContent}</p>
          </div>

          <button
            onClick={() => handleVote('B')}
            disabled={Boolean(userVotedSide) || isSubmitting}
            className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              userVotedSide === 'B'
                ? 'bg-olive-600 text-white font-bold'
                : userVotedSide
                ? 'bg-paper-200 dark:bg-ink-800 text-ink-400 dark:text-paper-400 cursor-default'
                : 'bg-olive-50 hover:bg-olive-100 text-olive-800 dark:bg-olive-950/40 dark:text-olive-300 border border-olive-200 dark:border-olive-800/60'
            }`}
          >
            {userVotedSide ? `${pctB}% support` : `Vote Argument B (${sideBAlias.split(' ')[1] || 'Beta'})`}
          </button>
        </div>
      </div>

      {/* Voting Progress Bar */}
      {userVotedSide && (
        <div className="space-y-1.5 pt-1">
          <div className="h-2.5 w-full rounded-full bg-paper-200 dark:bg-ink-800 overflow-hidden flex">
            <div className="bg-terracotta-600 transition-all duration-700" style={{ width: `${pctA}%` }} />
            <div className="bg-olive-600 transition-all duration-700" style={{ width: `${pctB}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-ink-500 dark:text-paper-400 font-mono">
            <span>{sideAAlias}: {votesA} votes ({pctA}%)</span>
            <span>{sideBAlias}: {votesB} votes ({pctB}%)</span>
          </div>
        </div>
      )}

      {/* Feature 12: "What Changed My Mind?" Poll for Debate */}
      <div className="pt-2">
        <MindChangePoll
          targetType="DEBATE"
          targetId={debate.id}
          initialStats={debate.mindChangeStats}
        />
      </div>
    </div>
  );
}
