import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { postService, topicService } from '../services/api.js';
import { PostCard } from '../components/posts/PostCard.jsx';
import { SkeletonPost } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Search as SearchIcon, SlidersHorizontal, Hash } from 'lucide-react';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState('latest'); // latest, explore (popular), top
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topics, setTopics] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    topicService.getTopics().then(res => {
      if (res.data.success) setTopics(res.data.topics);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim()) {
      handleSearch();
    }
  }, [filter, selectedTopic]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearchParams({ q: query.trim() });

    try {
      setLoading(true);
      setError(null);
      const params = {
        search: query.trim(),
        feed: filter === 'latest' ? 'new' : filter
      };
      if (selectedTopic) params.topic = selectedTopic;

      const res = await postService.getPosts(params);
      if (res.data.success) {
        setResults(res.data.data);
      }
    } catch (err) {
      setError(err.message || "Failed to search discussions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header Form */}
      <div className="p-6 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across discussions, hashtags (#privacy), or ideas..."
              className="w-full bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-lg pl-10 pr-4 py-2.5 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-subtle transition-all"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-ink-500 dark:text-ink-400 font-semibold mr-1 font-mono text-[11px]">Sort:</span>
            {['latest', 'explore', 'top'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filter === f
                    ? 'bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/50 font-semibold'
                    : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                {f === 'latest' ? 'Newest' : f === 'explore' ? 'Trending' : 'Most Discussed'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-500 dark:text-ink-400 font-semibold font-mono text-[11px]">Filter Topic:</span>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-lg px-2.5 py-1 text-xs text-ink-900 dark:text-ink-100 focus:outline-none focus:border-terracotta-500"
            >
              <option value="">All Topics</option>
              {topics.map(t => (
                <option key={t.id} value={t.slug}>#{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Stream */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonPost />
          <SkeletonPost />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={handleSearch} />
      ) : query && results.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No matching discussions found"
          description={`We couldn't find anything matching "${query}". Try searching for broader terms, topics, or hashtags.`}
        />
      ) : (
        <div className="space-y-4">
          {results.map(post => (
            <PostCard key={post.id} post={post} onUpdate={handleSearch} />
          ))}
        </div>
      )}
    </div>
  );
}
