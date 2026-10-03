import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PostCard } from '../components/posts/PostCard.jsx';
import { ThoughtOfTheDayWidget } from '../components/debate/ThoughtOfTheDayWidget.jsx';
import { SkeletonPost } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Avatar } from '../components/identity/Avatar.jsx';
import { 
  Sparkles, 
  Flame, 
  Clock, 
  Plus, 
  MessageSquare, 
  SlidersHorizontal 
} from 'lucide-react';

export function Home() {
  const { user, activeIdentity } = useAuth();
  const [feedType, setFeedType] = useState('home'); // 'home' (personalized), 'explore' (trending), 'new'
  const [statementFilter, setStatementFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [feedType, statementFilter, languageFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { feed: feedType };
      if (statementFilter) params.statementType = statementFilter;
      if (languageFilter) params.language = languageFilter;

      const res = await postService.getPosts(params);
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load discussions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Thought of the Day Widget (Section 52) */}
      <ThoughtOfTheDayWidget />

      {/* Floating Composer Quick Bar */}
      <div className="p-4 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-850 flex items-center gap-3 shadow-subtle">
        <Avatar
          seed={activeIdentity?.avatarSeed || 'anon'}
          shape={activeIdentity?.avatarShape || 'geometric'}
          color={activeIdentity?.avatarColor || '#C45A3C'}
          size="md"
        />
        <Link
          to="/create"
          className="flex-1 bg-paper-100 hover:bg-paper-200/80 dark:bg-ink-800 dark:hover:bg-ink-700 border border-paper-200 dark:border-ink-700 rounded-lg px-4 py-2.5 text-xs text-ink-500 dark:text-paper-400 flex items-center justify-between transition-colors"
        >
          <span>What's on your mind? Share anonymously...</span>
          <Plus className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
        </Link>
      </div>

      {/* Feed Tabs */}
      <div className="flex items-center justify-between border-b border-paper-200 dark:border-ink-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedType('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              feedType === 'home'
                ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 dark:bg-terracotta-950/40 dark:text-terracotta-300 dark:border-terracotta-800/60 font-semibold shadow-subtle'
                : 'text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400" />
            <span>For You</span>
          </button>

          <button
            onClick={() => setFeedType('explore')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              feedType === 'explore'
                ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 dark:bg-terracotta-950/40 dark:text-terracotta-300 dark:border-terracotta-800/60 font-semibold shadow-subtle'
                : 'text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400" />
            <span>Trending</span>
          </button>

          <button
            onClick={() => setFeedType('top')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              feedType === 'top'
                ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 dark:bg-terracotta-950/40 dark:text-terracotta-300 dark:border-terracotta-800/60 font-semibold shadow-subtle'
                : 'text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
            <span>Top Rated</span>
          </button>
        </div>

        <Link
          to="/debates"
          className="text-xs text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold flex items-center gap-1"
        >
          <span>Blind Debates</span>
          <span>→</span>
        </Link>
      </div>

      {/* Statement Type & Language Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-ink-400 dark:text-paper-400 font-mono mr-1">Classification:</span>
          {[
            { id: '', label: 'All' },
            { id: 'OPINION', label: '💭 Opinion' },
            { id: 'FACT', label: '📚 Fact' },
            { id: 'QUESTION', label: '❓ Question' },
            { id: 'IDEA', label: '💡 Idea' },
            { id: 'INFORMATION', label: '📰 Information' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatementFilter(st.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                statementFilter === st.id
                  ? 'bg-terracotta-600 text-white shadow-subtle font-semibold'
                  : 'bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-400 dark:text-paper-400 font-mono">Language:</span>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-white dark:bg-ink-800 border border-paper-200 dark:border-ink-700 rounded-lg px-2.5 py-1 text-[11px] text-ink-800 dark:text-paper-200 focus:outline-none focus:border-terracotta-500 shadow-subtle"
          >
            <option value="">All Languages</option>
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
          </select>
        </div>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonPost />
          <SkeletonPost />
          <SkeletonPost />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={fetchPosts} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No discussions found"
          description="Your personalized feed is quiet. Start the first anonymous discussion or follow more topics."
          actionText="Create Discussion"
          actionLink="/create"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
