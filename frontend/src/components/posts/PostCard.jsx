import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../identity/Avatar.jsx';
import { PollWidget } from './PollWidget.jsx';
import { ReportModal } from '../moderation/ReportModal.jsx';
import { postService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { 
  MessageSquare, 
  Bookmark, 
  Share2, 
  ShieldAlert, 
  Sparkles,
  Heart,
  Lightbulb,
  HelpCircle,
  Laugh,
  Flame,
  AlertTriangle,
  Paperclip,
  Turtle,
  Globe,
  Brain,
  Send
} from 'lucide-react';

const REACTION_CONFIG = [
  { type: 'AGREE', icon: Heart, label: 'Agree', activeColor: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800/60' },
  { type: 'INSIGHTFUL', icon: Lightbulb, label: 'Insightful', activeColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60' },
  { type: 'THOUGHT_PROVOKING', icon: HelpCircle, label: 'Thought-provoking', activeColor: 'text-terracotta-700 bg-terracotta-50 border-terracotta-200 dark:text-terracotta-300 dark:bg-terracotta-950/40 dark:border-terracotta-800/60' },
  { type: 'FUNNY', icon: Laugh, label: 'Funny', activeColor: 'text-olive-700 bg-olive-50 border-olive-200 dark:text-olive-300 dark:bg-olive-950/40 dark:border-olive-800/60' },
  { type: 'STRONG_POINT', icon: Flame, label: 'Strong Point', activeColor: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/40 dark:border-orange-800/60' }
];

export function PostCard({ post, onUpdate }) {
  const { isAuthenticated, activeIdentity } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts || {});
  const [userReactions, setUserReactions] = useState(post.userReactions || []);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [bookmarksCount, setBookmarksCount] = useState(post.bookmarksCount || 0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleStartChat = () => {
    if (!isAuthenticated) {
      toast.warning("Please sign in to start an anonymous chat.");
      return;
    }
    if (!post.identity) return;
    navigate(`/messages?recipientId=${post.identity.id}&name=${encodeURIComponent(post.identity.displayName)}&seed=${encodeURIComponent(post.identity.avatarSeed || '')}&shape=${encodeURIComponent(post.identity.avatarShape || '')}&color=${encodeURIComponent(post.identity.avatarColor || '')}`);
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleToggleReaction = async (reactionType) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to react to discussions.");
      return;
    }

    try {
      const res = await postService.toggleReaction(post.id, reactionType);
      if (res.data.success) {
        setReactionCounts(res.data.reactionCounts);
        setUserReactions(res.data.userReactions);
      }
    } catch (err) {
      toast.error(err.message || "Failed to react.");
    }
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      toast.warning("Please log in to bookmark discussions.");
      return;
    }

    try {
      const res = await postService.toggleBookmark(post.id);
      if (res.data.success) {
        setIsBookmarked(res.data.isBookmarked);
        setBookmarksCount(prev => res.data.isBookmarked ? prev + 1 : Math.max(0, prev - 1));
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to save bookmark.");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Discussion link copied to clipboard!");
  };

  return (
    <article className="group relative rounded-xl bg-white dark:bg-ink-850 p-6 border border-paper-200 dark:border-ink-800 shadow-subtle hover:shadow-card hover:border-paper-300 dark:hover:border-ink-700 transition-all duration-200">
      {/* Header: Anonymous Identity & Topic */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            seed={post.identity?.avatarSeed || 'anon'}
            shape={post.identity?.avatarShape || 'geometric'}
            color={post.identity?.avatarColor || '#C45A3C'}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink-900 dark:text-paper-100 tracking-tight hover:text-terracotta-600 dark:hover:text-terracotta-400 transition-colors">
                {post.identity?.displayName || "Anonymous Fox"}
              </span>
              {post.identity?.identityType === 'TEMPORARY' && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-paper-200 dark:bg-ink-800 text-ink-600 dark:text-paper-300 border border-paper-300 dark:border-ink-700 rounded">
                  Disappearing
                </span>
              )}
            </div>
            <span className="text-xs text-ink-400 dark:text-paper-400 font-medium">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Discussion Temperature Badge (Feature 7) */}
          {post.temperature && (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${
              post.temperature.level === 'HIGHLY_HEATED' 
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                : post.temperature.level === 'HEATED'
                  ? 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/50'
                  : post.temperature.level === 'ACTIVE'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
                    : 'bg-olive-50 text-olive-800 border-olive-200 dark:bg-olive-950/40 dark:text-olive-300 dark:border-olive-800/50'
            }`}>
              <span>{post.temperature.label}</span>
            </span>
          )}

          {post.topic && (
            <Link
              to={`/topics/${post.topic.slug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-paper-200 dark:border-ink-700 bg-paper-100 dark:bg-ink-800 text-ink-700 dark:text-paper-200 hover:text-terracotta-600 dark:hover:text-terracotta-400 transition-colors"
            >
              <span>#{post.topic.name}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Feature Badges Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Statement Type Label (Feature 3) */}
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-paper-100 dark:bg-ink-800 text-ink-700 dark:text-paper-300 border border-paper-200 dark:border-ink-700">
          {post.statementType === 'FACT' ? '📚 Fact' :
           post.statementType === 'QUESTION' ? '❓ Question' :
           post.statementType === 'IDEA' ? '💡 Idea' :
           post.statementType === 'INFORMATION' ? '📰 Information' :
           '💭 Opinion'}
        </span>

        {/* "Challenge My Opinion" Badge (Feature 2) */}
        {post.isChallengeOpinion && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Challenge My Opinion</span>
          </span>
        )}

        {/* High-Quality Argument Badge (Feature 13) */}
        {post.argumentQuality?.isHighQuality && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-olive-50 text-olive-800 border border-olive-200 dark:bg-olive-950/40 dark:text-olive-300 dark:border-olive-800 flex items-center gap-1">
            <Brain className="w-3 h-3 text-olive-600 dark:text-olive-400" />
            <span>High-Quality Argument</span>
          </span>
        )}

        {/* Slow Mode Indicator (Feature 6) */}
        {post.slowMode && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-paper-100 text-ink-600 border border-paper-200 dark:bg-ink-800 dark:text-paper-300 dark:border-ink-700 flex items-center gap-1">
            <Turtle className="w-3 h-3 text-olive-600" />
            <span>Slow Mode</span>
          </span>
        )}

        {/* Multi-Language Tag (Feature 9) */}
        {post.language && post.language !== 'en' && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-paper-100 text-ink-600 border border-paper-200 dark:bg-ink-800 dark:text-paper-300 dark:border-ink-700 flex items-center gap-1 uppercase">
            <Globe className="w-3 h-3 text-ink-500" />
            <span>{post.language}</span>
          </span>
        )}
      </div>

      {/* Scam / Phishing Alert Banner (Feature 10) */}
      {post.isPotentialScam && (
        <div className="mb-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 shadow-subtle">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">🚨 Potential Scam / Phishing Alert:</span>{" "}
            <span>{post.scamReason || "This discussion contains suspicious promotional or payment-related content. Never share credentials or transfer funds."}</span>
          </div>
        </div>
      )}

      {/* Title & Body */}
      <div className="space-y-2 mb-3">
        <Link to={`/post/${post.id}`} className="block group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors">
          <h2 className="font-serif text-lg md:text-xl font-bold text-ink-900 dark:text-paper-100 tracking-tight leading-snug">
            {post.title}
          </h2>
        </Link>
        <p className="text-ink-700 dark:text-paper-300 text-sm md:text-base leading-relaxed whitespace-pre-line line-clamp-4 font-sans">
          {post.content}
        </p>
      </div>

      {/* Source & Evidence Attachment Badge (Feature 4) */}
      {post.sourceUrl && (
        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 text-xs text-ink-700 dark:text-paper-200">
          <Paperclip className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400 shrink-0" />
          <span className="font-medium text-ink-500 dark:text-paper-400">Source attached:</span>
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold truncate max-w-xs"
          >
            {post.sourceTitle || post.sourceUrl}
          </a>
        </div>
      )}

      {/* Optional Media */}
      {post.mediaUrl && (
        <div className="my-4 overflow-hidden rounded-lg border border-paper-200 dark:border-ink-700 max-h-96">
          <img
            src={post.mediaUrl.startsWith('http') ? post.mediaUrl : post.mediaUrl}
            alt="Discussion media"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Poll Widget if embedded */}
      {post.poll && (
        <PollWidget poll={post.poll} onVoteSuccess={() => onUpdate && onUpdate()} />
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.hashtags.map(tag => (
            <Link
              key={tag}
              to={`/search?q=${encodeURIComponent(tag)}`}
              className="text-xs font-medium text-ink-500 dark:text-paper-400 hover:text-terracotta-600 dark:hover:text-terracotta-400 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Actions & Reactions Bar */}
      <div className="flex flex-wrap items-center justify-between pt-4 border-t border-paper-100 dark:border-ink-800 gap-2">
        {/* Reactions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {REACTION_CONFIG.map(({ type, icon: Icon, label, activeColor }) => {
            const count = reactionCounts[type] || 0;
            const hasReacted = userReactions.includes(type);

            return (
              <button
                key={type}
                onClick={() => handleToggleReaction(type)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  hasReacted
                    ? activeColor
                    : 'bg-paper-50 dark:bg-ink-800/80 border-paper-200 dark:border-ink-700 text-ink-600 dark:text-paper-400 hover:text-ink-900 dark:hover:text-white hover:border-paper-300 dark:hover:border-ink-600'
                }`}
                title={label}
              >
                <Icon className={`w-3.5 h-3.5 ${hasReacted ? 'scale-110' : ''}`} />
                {count > 0 && <span className="font-mono text-[11px]">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Discussion Utilities (Comments, Bookmark, Share, Report) */}
        <div className="flex items-center gap-1">
          <Link
            to={`/post/${post.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.commentsCount || 0}</span>
          </Link>

          {post.identity && post.identity.id !== activeIdentity?.id && (
            <button
              onClick={handleStartChat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-600 dark:text-paper-300 hover:text-terracotta-600 hover:bg-terracotta-50 dark:hover:bg-terracotta-950/40 border border-transparent hover:border-terracotta-200 transition-all"
              title={`Chat privately with ${post.identity.displayName}`}
            >
              <Send className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400" />
              <span className="hidden sm:inline">Chat</span>
            </button>
          )}

          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-lg text-xs transition-colors ${
              isBookmarked ? 'text-terracotta-600 bg-terracotta-50 dark:bg-terracotta-950/40' : 'text-ink-500 dark:text-paper-400 hover:text-ink-900 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-ink-800'
            }`}
            title="Bookmark discussion"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-lg text-xs text-ink-500 dark:text-paper-400 hover:text-ink-900 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
            title="Share discussion"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="p-2 rounded-lg text-xs text-ink-400 dark:text-paper-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Report to moderation"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={post.id}
        targetType="POST"
        targetTitle={post.title}
      />
    </article>
  );
}
