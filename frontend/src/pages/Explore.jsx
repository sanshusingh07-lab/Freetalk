import React, { useState, useEffect } from 'react';
import { postService, featureService, topicService } from '../services/api.js';
import { PostCard } from '../components/posts/PostCard.jsx';
import { BlindDebateCard } from '../components/debate/BlindDebateCard.jsx';
import { IdeaVsIdeaWidget } from '../components/debate/IdeaVsIdeaWidget.jsx';
import { SkeletonPost } from '../components/ui/Skeleton.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Flame, Sparkles, Scale, Split, TrendingUp } from 'lucide-react';

export function Explore() {
  const [posts, setPosts] = useState([]);
  const [debates, setDebates] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExploreData();
  }, []);

  const loadExploreData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [postsRes, debatesRes, ideasRes] = await Promise.all([
        postService.getPosts({ feed: 'explore', limit: 15 }),
        featureService.getDebates(),
        featureService.getIdeas()
      ]);

      if (postsRes.data.success) setPosts(postsRes.data.data);
      if (debatesRes.data.success) setDebates(debatesRes.data.debates);
      if (ideasRes.data.success) setIdeas(ideasRes.data.ideas);
    } catch (err) {
      setError(err.message || "Failed to load explore feed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600 dark:text-terracotta-400 mb-2">
          <Flame className="w-4 h-4 text-terracotta-500" />
          <span>Discovery Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Explore Ideas Without Identities
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-xl mt-1 leading-relaxed">
          The most compelling discussions, blind debates, and rhetorical comparisons across the network.
        </p>
      </div>

      {/* Featured Blind Debate (Section 53) */}
      {debates.length > 0 && (
        <section>
          <BlindDebateCard debate={debates[0]} />
        </section>
      )}

      {/* Featured Idea vs Idea (Section 54) */}
      {ideas.length > 0 && (
        <section>
          <IdeaVsIdeaWidget idea={ideas[0]} />
        </section>
      )}

      {/* Discussions Stream */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-terracotta-500" />
            <span>Fast Growing Discussions</span>
          </h2>
          <span className="text-xs text-ink-600 dark:text-ink-300 font-mono">Weighted recency algorithm</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonPost />
            <SkeletonPost />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadExploreData} />
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onUpdate={loadExploreData} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
