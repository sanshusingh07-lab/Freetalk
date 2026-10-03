import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/identity/Avatar.jsx';
import { PostCard } from '../components/posts/PostCard.jsx';
import { SkeletonPost } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { MessageSquare, MessageCircle, Sparkles, Shield, Compass } from 'lucide-react';

export function Activity() {
  const { activeIdentity } = useAuth();
  const [activity, setActivity] = useState(null);
  const [tab, setTab] = useState('posts'); // 'posts' or 'comments'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await userService.getActivity();
      if (res.data.success) {
        setActivity(res.data.activity);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Profile Header */}
      <div className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar
            seed={activeIdentity?.avatarSeed || 'anon'}
            shape={activeIdentity?.avatarShape || 'geometric'}
            color={activeIdentity?.avatarColor || '#C45A3C'}
            size="xl"
          />
          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100">
              {activeIdentity?.displayName || "Anonymous Fox"}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-olive-50 dark:bg-olive-950/60 border border-olive-200 dark:border-olive-800/60 text-olive-700 dark:text-olive-300">
              <Sparkles className="w-3 h-3 text-olive-600 dark:text-olive-400" />
              <span>{activity?.contributionBadge || "🌱 Positive Contributor"}</span>
            </div>
            <p className="text-xs text-ink-500">
              Your contribution is evaluated by constructive insights, not follower counts.
            </p>
          </div>

          {/* Activity Metrics (No Followers) */}
          <div className="flex items-center gap-3 bg-paper-100 dark:bg-charcoal-800 p-3.5 rounded-xl border border-border">
            <div className="text-center px-2">
              <div className="text-lg font-bold font-serif text-ink-900 dark:text-ink-100">
                {activity?.discussionsCount || 0}
              </div>
              <div className="text-[10px] text-ink-500 uppercase tracking-wider">Discussions</div>
            </div>
            <div className="text-center px-2 border-l border-border">
              <div className="text-lg font-bold font-serif text-ink-900 dark:text-ink-100">
                {activity?.repliesCount || 0}
              </div>
              <div className="text-[10px] text-ink-500 uppercase tracking-wider">Replies</div>
            </div>
            <div className="text-center px-2 border-l border-border">
              <div className="text-lg font-bold font-serif text-ink-900 dark:text-ink-100">
                {activity?.topicsFollowedCount || 0}
              </div>
              <div className="text-[10px] text-ink-500 uppercase tracking-wider">Topics</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab === 'posts'
              ? 'bg-terracotta-50 dark:bg-terracotta-900/30 text-terracotta-800 dark:text-terracotta-200 border border-terracotta-500 shadow-sm'
              : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>My Discussions ({activity?.posts?.length || 0})</span>
        </button>

        <button
          onClick={() => setTab('comments')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab === 'comments'
              ? 'bg-terracotta-50 dark:bg-terracotta-900/30 text-terracotta-800 dark:text-terracotta-200 border border-terracotta-500 shadow-sm'
              : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>My Replies ({activity?.comments?.length || 0})</span>
        </button>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonPost />
          <SkeletonPost />
        </div>
      ) : tab === 'posts' ? (
        activity?.posts?.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No discussions started yet"
            description="Share your first thought or question anonymously."
            actionText="Create Discussion"
            actionLink="/create"
          />
        ) : (
          <div className="space-y-4">
            {activity.posts.map(p => (
              <PostCard key={p.id} post={p} onUpdate={fetchActivity} />
            ))}
          </div>
        )
      ) : (
        activity?.comments?.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No replies yet"
            description="Join an active discussion and share your anonymous perspective."
            actionText="Explore Feed"
            actionLink="/explore"
          />
        ) : (
          <div className="space-y-3">
            {activity.comments.map(c => (
              <div key={c.id} className="p-5 rounded-xl bg-surface border border-border space-y-2 shadow-sm">
                <div className="text-xs text-ink-500">
                  Replying on discussion:{' '}
                  <Link to={`/post/${c.post?.id}`} className="text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold">
                    "{c.post?.title}"
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-ink-800 dark:text-ink-200 leading-relaxed">{c.content}</p>
                <div className="text-[10px] text-ink-400 font-mono">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
