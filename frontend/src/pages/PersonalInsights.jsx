import React, { useState, useEffect } from 'react';
import { userService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SkeletonPost } from '../components/ui/Skeleton.jsx';
import { 
  BarChart3, 
  MessageSquare, 
  CornerDownRight, 
  Sparkles, 
  Compass, 
  Scale, 
  ShieldCheck, 
  Ghost,
  EyeOff,
  Flame,
  Lightbulb,
  HeartHandshake
} from 'lucide-react';

export function PersonalInsights() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTogglingGhost, setIsTogglingGhost] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await userService.getInsights();
      if (res.data.success) {
        setInsights(res.data.insights);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load personal insights.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGhost = async () => {
    try {
      setIsTogglingGhost(true);
      const res = await userService.toggleGhostMode();
      if (res.data.success) {
        setInsights(prev => ({ ...prev, isGhostMode: res.data.isGhostMode }));
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle Ghost Mode.");
    } finally {
      setIsTogglingGhost(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonPost />
        <SkeletonPost />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600 dark:text-terracotta-400">
            <BarChart3 className="w-4 h-4 text-terracotta-500" />
            <span>Personal Reflection Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-olive-700 dark:text-olive-300 bg-olive-50 dark:bg-olive-950/50 border border-olive-200 dark:border-olive-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Strictly Private to You</span>
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Personal Discussion Insights
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-2xl mt-1.5 leading-relaxed">
          Reflective metrics designed to illuminate your intellectual journey. FreeTalk has <span className="text-ink-800 dark:text-ink-200 font-semibold">no public profiles, no follower vanity counts, and zero performative popularity</span>.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Discussions Started */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-terracotta-600 dark:text-terracotta-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Discussions Started</span>
            <div className="p-2 rounded-lg bg-terracotta-50 dark:bg-terracotta-900/30 border border-terracotta-200 dark:border-terracotta-800/40">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-ink-900 dark:text-ink-100">
              {insights?.discussionsCount || 0}
            </div>
            <p className="text-[11px] text-ink-400 mt-1">Unique premises and thoughts brought forward</p>
          </div>
        </div>

        {/* Replies Contributed */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-olive-600 dark:text-olive-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Replies Contributed</span>
            <div className="p-2 rounded-lg bg-olive-50 dark:bg-olive-950/40 border border-olive-200 dark:border-olive-800/40">
              <CornerDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-ink-900 dark:text-ink-100">
              {insights?.repliesCount || 0}
            </div>
            <p className="text-[11px] text-ink-400 mt-1">Constructive perspectives contributed in threads</p>
          </div>
        </div>

        {/* Helpful Reactions Received */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Helpful Reactions</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-ink-900 dark:text-ink-100">
              {insights?.helpfulReactions || 0}
            </div>
            <p className="text-[11px] text-ink-400 mt-1">Peers found your contributions thoughtful</p>
          </div>
        </div>

        {/* Topics Explored */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-olive-600 dark:text-olive-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Topics Explored</span>
            <div className="p-2 rounded-lg bg-olive-50 dark:bg-olive-950/40 border border-olive-200 dark:border-olive-800/40">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-ink-900 dark:text-ink-100">
              {insights?.topicsExplored || 0}
            </div>
            <p className="text-[11px] text-ink-400 mt-1">Cross-disciplinary domains engaged</p>
          </div>
        </div>

        {/* Debates Participated */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-terracotta-600 dark:text-terracotta-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Blind Debates Weighed</span>
            <div className="p-2 rounded-lg bg-terracotta-50 dark:bg-terracotta-900/30 border border-terracotta-200 dark:border-terracotta-800/40">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-ink-900 dark:text-ink-100">
              {insights?.debatesParticipated || 0}
            </div>
            <p className="text-[11px] text-ink-400 mt-1">Objective argument evaluations cast</p>
          </div>
        </div>

        {/* Dominant Interest */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-terracotta-600 dark:text-terracotta-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Dominant Interest</span>
            <div className="p-2 rounded-lg bg-terracotta-50 dark:bg-terracotta-900/30 border border-terracotta-200 dark:border-terracotta-800/40">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-serif text-ink-900 dark:text-ink-100 truncate">
              {insights?.mostDiscussedTopic || "Ideas & Society"}
            </div>
            <p className="text-[11px] text-ink-400 mt-1">Primary area of intellectual curiosity</p>
          </div>
        </div>
      </div>

      {/* Constructive Tone & Quality Index */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 rounded-xl bg-surface border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-olive-600 dark:text-olive-400" />
              <h3 className="font-serif text-base font-bold text-ink-900 dark:text-ink-100">Constructive Tone & Integrity Score</h3>
            </div>
            <span className="text-xs font-mono font-bold text-olive-700 dark:text-olive-300 bg-olive-50 dark:bg-olive-950/60 px-2.5 py-0.5 rounded-full border border-olive-200 dark:border-olive-800/50">
              {insights?.constructiveToneAverage || 96}% Positive Index
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full h-2.5 rounded-full bg-paper-200 dark:bg-charcoal-700 overflow-hidden">
              <div
                className="h-full bg-olive-600 dark:bg-olive-500 rounded-full transition-all duration-1000"
                style={{ width: `${insights?.constructiveToneAverage || 96}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-ink-400 font-mono">
              <span>Hostile / Toxic (0%)</span>
              <span>Neutral Disagreement (50%)</span>
              <span>Constructive & Nuanced (100%)</span>
            </div>
          </div>

          <p className="text-xs text-ink-600 dark:text-ink-400 leading-relaxed">
            Your contributions consistently adhere to healthy civil discourse, respectful counterpoints, and intellectual humility. FreeTalk AI monitors and rewards well-structured logic.
          </p>
        </div>

        {/* Ghost Mode Card */}
        <div className="p-6 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-border shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink-800 dark:text-ink-200">
                <Ghost className="w-5 h-5 text-terracotta-500" />
                <h4 className="font-serif text-base font-bold text-ink-900 dark:text-ink-100">Ghost Mode</h4>
              </div>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                insights?.isGhostMode 
                  ? 'bg-olive-50 dark:bg-olive-950/60 text-olive-700 dark:text-olive-300 border-olive-200 dark:border-olive-800/60 font-semibold' 
                  : 'bg-surface text-ink-500 border-border'
              }`}>
                {insights?.isGhostMode ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-ink-500 leading-relaxed">
              When active, your presence is completely hidden from online presence meters and active discussion counts.
            </p>
          </div>

          <Button
            variant={insights?.isGhostMode ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleGhost}
            isLoading={isTogglingGhost}
            icon={insights?.isGhostMode ? EyeOff : Ghost}
            className="w-full"
          >
            {insights?.isGhostMode ? 'Disable Ghost Mode' : 'Enable Ghost Mode'}
          </Button>
        </div>
      </div>
    </div>
  );
}
