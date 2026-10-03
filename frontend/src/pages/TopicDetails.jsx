import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { topicService, postService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PostCard } from '../components/posts/PostCard.jsx';
import { SkeletonPost } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Hash, Plus, Check, MessageSquare, ArrowLeft } from 'lucide-react';

export function TopicDetails() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('explore'); // explore (trending), new, top
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTopicData();
  }, [slug, filter]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [topicRes, postsRes] = await Promise.all([
        topicService.getTopic(slug),
        postService.getPosts({ topic: slug, feed: filter })
      ]);

      if (topicRes.data.success) setTopic(topicRes.data.topic);
      if (postsRes.data.success) setPosts(postsRes.data.data);
    } catch (err) {
      setError(err.message || "Failed to load topic discussions.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.warning("Please log in to follow topics.");
      return;
    }

    try {
      const res = await topicService.toggleFollow(topic.id);
      if (res.data.success) {
        setTopic(prev => ({
          ...prev,
          isFollowing: res.data.isFollowing,
          followerCount: res.data.isFollowing ? prev.followerCount + 1 : Math.max(0, prev.followerCount - 1)
        }));
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update follow status.");
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/topics" className="inline-flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>All Topics</span>
      </Link>

      {/* Topic Banner */}
      {topic && (
        <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: topic.color || '#C45A3C' }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-subtle"
                style={{
                  backgroundColor: `${topic.color || '#C45A3C'}20`,
                  color: topic.color || '#C45A3C',
                  border: `1px solid ${topic.color || '#C45A3C'}40`
                }}
              >
                <Hash className="w-7 h-7" />
              </div>

              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
                  #{topic.name}
                </h1>
                <div className="text-xs text-ink-500 dark:text-ink-400 font-mono mt-0.5">
                  {topic.postCount || 0} discussions • {topic.followerCount || 0} community members
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleFollow}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                topic.isFollowing
                  ? 'bg-paper-100 dark:bg-charcoal-800 text-terracotta-700 dark:text-terracotta-300 border border-paper-200 dark:border-charcoal-700'
                  : 'bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-subtle'
              }`}
            >
              {topic.isFollowing ? (
                <>
                  <Check className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
                  <span>Following Topic</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Follow #{topic.name}</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-ink-700 dark:text-ink-200 max-w-2xl mt-4 leading-relaxed relative z-10 font-sans">
            {topic.description}
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-paper-100 dark:border-ink-800 pb-2">
        <button
          onClick={() => setFilter('explore')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            filter === 'explore' ? 'bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/60 font-semibold' : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            filter === 'new' ? 'bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/60 font-semibold' : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => setFilter('top')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            filter === 'top' ? 'bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/60 font-semibold' : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          Top Rated
        </button>
      </div>

      {/* Discussions */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonPost />
          <SkeletonPost />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadTopicData} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={`No discussions in #${topic?.name || 'this topic'} yet`}
          description="Be the first to share an anonymous thought or ask a question in this community."
          actionText="Create Discussion"
          actionLink="/create"
        />
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onUpdate={loadTopicData} />
          ))}
        </div>
      )}
    </div>
  );
}
