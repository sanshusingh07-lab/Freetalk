import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { AnonymousIdentityCard } from '../identity/AnonymousIdentityCard.jsx';
import { topicService, aiService } from '../../services/api.js';
import { TrendingUp, ShieldCheck, HeartHandshake, Sparkles, Flame, Zap } from 'lucide-react';

export function RightSidebar({ className = '' }) {
  const { user, activeIdentity, regenerateIdentity } = useAuth();
  const [topics, setTopics] = useState([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isAiLoaded, setIsAiLoaded] = useState(false);

  useEffect(() => {
    fetchTopTopics();
  }, []);

  const fetchTopTopics = async () => {
    try {
      // Fetch AI-calculated trending topics with velocity telemetry
      const res = await aiService.getTrendingInsights();
      if (res.data.success && res.data.trending?.length > 0) {
        setTopics(res.data.trending.slice(0, 6));
        setIsAiLoaded(true);
        return;
      }
    } catch (err) {
      // Fallback to standard topics endpoint
    }

    try {
      const res = await topicService.getTopics();
      if (res.data.success) {
        setTopics(res.data.topics.slice(0, 6));
      }
    } catch (err) {
      // silent
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      await regenerateIdentity();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <aside className={`w-80 shrink-0 space-y-6 py-6 ${className}`}>
      {/* Active Anonymous Identity Card */}
      {activeIdentity && (
        <AnonymousIdentityCard
          identity={activeIdentity}
          reputation={user?.contributionBadge || "🌱 Positive Contributor"}
          discussionsCount={user?.postsCount || 4}
          repliesCount={user?.commentsCount || 12}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Trending Topic Communities */}
      <div className="p-5 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-850 space-y-3.5 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-800 dark:text-paper-200 font-mono">
            <Flame className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
            <span>AI Trending Topics</span>
          </div>
          {isAiLoaded && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-olive-700 bg-olive-50 dark:text-olive-300 dark:bg-olive-950/60 px-2 py-0.5 rounded-full border border-olive-200 dark:border-olive-800/60 font-mono">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Velocity</span>
            </span>
          )}
        </div>

        <div className="space-y-1">
          {topics.map((t, idx) => (
            <Link
              key={t.id}
              to={`/topics/${t.slug}`}
              className="block p-2 rounded-lg hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md border ${
                    idx === 0 
                      ? 'bg-terracotta-100 text-terracotta-800 border-terracotta-200 dark:bg-terracotta-950/50 dark:text-terracotta-300 dark:border-terracotta-800' 
                      : idx === 1 
                        ? 'bg-olive-100 text-olive-800 border-olive-200 dark:bg-olive-950/50 dark:text-olive-300 dark:border-olive-800' 
                        : idx === 2
                          ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-paper-200/60 dark:bg-ink-800 text-ink-500 dark:text-paper-400 border-transparent'
                  }`}>
                    #{t.trendingRank || (idx + 1)}
                  </span>
                  <span className="text-xs font-semibold text-ink-900 dark:text-paper-100 group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors">
                    #{t.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {t.surgePercentage ? (
                    <span className="text-[10px] font-mono text-olive-700 dark:text-olive-300 font-semibold bg-olive-50 dark:bg-olive-950/40 px-1.5 py-0.5 rounded border border-olive-200 dark:border-olive-800/40">
                      +{t.surgePercentage}%
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-ink-400 dark:text-paper-400">
                      {t.postCount || t.totalPostCount || 0} posts
                    </span>
                  )}
                </div>
              </div>

              {t.aiSummary && (
                <p className="text-[10px] text-ink-500 dark:text-paper-400 mt-1 pl-6 line-clamp-1">
                  {t.aiSummary}
                </p>
              )}
            </Link>
          ))}
        </div>

        <div className="pt-2 border-t border-paper-100 dark:border-ink-800 flex items-center justify-between">
          <Link to="/topics" className="text-[11px] text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold flex items-center gap-1">
            <span>Explore All Topics</span>
            <span>→</span>
          </Link>
          <span className="text-[10px] text-ink-400 dark:text-paper-400 font-mono">Real-time</span>
        </div>
      </div>

      {/* Community Health Card */}
      <div className="p-5 rounded-xl border border-olive-200 dark:border-olive-800/80 bg-olive-50/70 dark:bg-olive-950/30 space-y-2 shadow-subtle">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-olive-800 dark:text-olive-300 font-mono">
          <ShieldCheck className="w-4 h-4 text-olive-600 dark:text-olive-400" />
          <span>Community Health</span>
        </div>
        <div className="text-2xl font-bold text-ink-900 dark:text-paper-100 font-mono">
          98.6%
        </div>
        <p className="text-xs text-olive-900/80 dark:text-olive-200/80 leading-relaxed">
          Discussions remain constructive and compliant with zero harassment tolerance.
        </p>
      </div>

      {/* Guidelines & Policy Link */}
      <div className="flex items-center justify-between px-2 text-[11px] text-ink-400 dark:text-paper-400 font-medium">
        <Link to="/guidelines" className="hover:text-terracotta-600 dark:hover:text-terracotta-400 transition-colors">
          Guidelines
        </Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-terracotta-600 dark:hover:text-terracotta-400 transition-colors">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link to="/about" className="hover:text-terracotta-600 dark:hover:text-terracotta-400 transition-colors">
          About FreeTalk
        </Link>
      </div>
    </aside>
  );
}
