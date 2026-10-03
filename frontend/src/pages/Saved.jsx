import React, { useState, useEffect } from 'react';
import { bookmarkService } from '../services/api.js';
import { PostCard } from '../components/posts/PostCard.jsx';
import { SkeletonPost } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Bookmark, Folder } from 'lucide-react';

export function Saved() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState('All');

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await bookmarkService.getBookmarks();
      if (res.data.success) {
        setBookmarks(res.data.bookmarks);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const collections = ['All', ...new Set(bookmarks.map(b => b.collectionName))];

  const filtered = selectedCollection === 'All'
    ? bookmarks
    : bookmarks.filter(b => b.collectionName === selectedCollection);

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta-700 dark:text-terracotta-400 mb-2">
          <Bookmark className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
          <span>Curated Knowledge</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Saved Discussions
        </h1>
        <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-300 max-w-xl mt-1 leading-relaxed font-sans">
          Discussions you've bookmarked for reflection. Only visible to your private session.
        </p>

        {collections.length > 1 && (
          <div className="flex items-center gap-2 pt-4 mt-4 border-t border-paper-100 dark:border-ink-800">
            {collections.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCollection(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCollection === c
                    ? 'bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/60 font-semibold'
                    : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonPost />
          <SkeletonPost />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Find a discussion worth keeping. Click the bookmark icon on any post to store it in your private archive."
          actionText="Explore Discussions"
          actionLink="/explore"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(b => (
            <PostCard key={b.post.id} post={b.post} onUpdate={fetchBookmarks} />
          ))}
        </div>
      )}
    </div>
  );
}
