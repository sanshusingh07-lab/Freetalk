import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { topicService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { SkeletonTopic } from '../components/ui/Skeleton.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Compass, Check, Plus, Hash } from 'lucide-react';

export function Topics() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await topicService.getTopics();
      if (res.data.success) {
        setTopics(res.data.topics);
      }
    } catch (err) {
      setError(err.message || "Failed to load topics.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (topicId) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to follow topics.");
      return;
    }

    try {
      const res = await topicService.toggleFollow(topicId);
      if (res.data.success) {
        setTopics(prev => prev.map(t => {
          if (t.id === topicId) {
            return {
              ...t,
              isFollowing: res.data.isFollowing,
              followerCount: res.data.isFollowing ? t.followerCount + 1 : Math.max(0, t.followerCount - 1)
            };
          }
          return t;
        }));
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update topic follow.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600 dark:text-terracotta-400 mb-2">
          <Compass className="w-4 h-4 text-terracotta-500" />
          <span>Topic Communities</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Follow Ideas, Not Influencers
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-xl mt-1 leading-relaxed">
          On FreeTalk, communities revolve around subject matter rather than charismatic individuals. Follow topics to shape your personalized anonymous stream.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonTopic />
          <SkeletonTopic />
          <SkeletonTopic />
          <SkeletonTopic />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={fetchTopics} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topics.map(t => (
            <div
              key={t.id}
              className="p-5 rounded-xl bg-surface border border-border hover:border-terracotta-500/50 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shadow-sm"
                      style={{
                        backgroundColor: `${t.color || '#C45A3C'}18`,
                        color: t.color || '#C45A3C',
                        border: `1px solid ${t.color || '#C45A3C'}30`
                      }}
                    >
                      <Hash className="w-5 h-5" />
                    </div>
                    <div>
                      <Link
                        to={`/topics/${t.slug}`}
                        className="font-serif text-base font-bold text-ink-900 dark:text-ink-100 hover:text-terracotta-600 dark:hover:text-terracotta-400 transition-colors"
                      >
                        #{t.name}
                      </Link>
                      <div className="text-[11px] text-ink-400 font-mono">
                        {t.postCount || 0} discussions • {t.followerCount || 0} followers
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      t.isFollowing
                        ? 'bg-olive-50 dark:bg-olive-950/60 text-olive-700 dark:text-olive-300 border border-olive-300 dark:border-olive-800/60'
                        : 'bg-paper-100 dark:bg-charcoal-800 hover:bg-paper-200 dark:hover:bg-charcoal-700 text-ink-800 dark:text-ink-200 border border-border'
                    }`}
                  >
                    {t.isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-ink-600 dark:text-ink-400 leading-relaxed line-clamp-2">
                  {t.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-[11px] text-ink-400">
                <span>Active discussions ongoing</span>
                <Link to={`/topics/${t.slug}`} className="text-terracotta-600 dark:text-terracotta-400 hover:text-terracotta-700 font-semibold">
                  Browse &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
