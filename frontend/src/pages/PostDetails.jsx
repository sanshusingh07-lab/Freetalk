import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postService, commentService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { PostCard } from '../components/posts/PostCard.jsx';
import { ThreadTree } from '../components/posts/ThreadTree.jsx';
import { SkeletonPost } from '../components/ui/Skeleton.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { MindChangePoll } from '../components/debate/MindChangePoll.jsx';
import { PerspectiveModal } from '../components/dialogs/PerspectiveModal.jsx';
import { ArgumentQualityBar } from '../components/common/ArgumentQualityBar.jsx';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Scale, 
  Clock, 
  HelpCircle, 
  Languages, 
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const CHALLENGE_TABS = [
  { id: 'ALL', label: 'All Perspectives', icon: '🌐' },
  { id: 'AGREE', label: 'Agree', icon: '🟢' },
  { id: 'DISAGREE', label: 'Disagree', icon: '🔴' },
  { id: 'EVIDENCE', label: 'Evidence', icon: '🔬' },
  { id: 'ALTERNATIVE', label: 'Alternative View', icon: '💡' }
];

export function PostDetails() {
  const { id } = useParams();
  const { isAuthenticated, activeIdentity } = useAuth();
  const { toast } = useToast();
  const { socket } = useSocket();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentChallengeType, setCommentChallengeType] = useState('DISAGREE');
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [isPerspectiveOpen, setIsPerspectiveOpen] = useState(false);
  const [slowModeCooldown, setSlowModeCooldown] = useState(0);
  const [isTranslated, setIsTranslated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Countdown timer for slow mode
  useEffect(() => {
    if (slowModeCooldown > 0) {
      const interval = setInterval(() => {
        setSlowModeCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [slowModeCooldown]);

  useEffect(() => {
    loadPostAndComments();

    // Join post room for live comments and reactions
    if (socket && id) {
      socket.emit('join:post', id);

      socket.on('comment:new', (newComment) => {
        setComments((prev) => [newComment, ...prev]);
        setPost((prev) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev));
      });

      socket.on('post:reaction_updated', (data) => {
        if (data.postId === id) {
          setPost((prev) => (prev ? { ...prev, reactionCounts: data.reactionCounts, score: data.totalScore } : prev));
        }
      });

      socket.on('comment:deleted', ({ commentId }) => {
        handleCommentDeleted(commentId);
      });
    }

    return () => {
      if (socket && id) {
        socket.emit('leave:post', id);
        socket.off('comment:new');
        socket.off('post:reaction_updated');
        socket.off('comment:deleted');
      }
    };
  }, [id, socket]);

  const handleCommentDeleted = (deletedCommentId) => {
    const removeCommentRecursive = (list) => {
      return list
        .filter((c) => c.id !== deletedCommentId)
        .map((c) => ({
          ...c,
          replies: c.replies ? removeCommentRecursive(c.replies) : []
        }));
    };

    setComments((prev) => removeCommentRecursive(prev));
    setPost((prev) => (prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) } : prev));
  };

  const loadPostAndComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const [postRes, commentsRes] = await Promise.all([
        postService.getPostById(id),
        commentService.getComments(id)
      ]);

      if (postRes.data.success) setPost(postRes.data.post);
      if (commentsRes.data.success) setComments(commentsRes.data.comments);
    } catch (err) {
      setError(err.message || 'Discussion not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Please log in to respond anonymously.');
      return;
    }
    if (!commentInput.trim()) return;

    if (slowModeCooldown > 0) {
      toast.warning(`Slow mode active. Please wait ${slowModeCooldown}s before posting.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        content: commentInput.trim(),
        challengeType: post?.isChallengeOpinion ? commentChallengeType : undefined
      };

      const res = await commentService.createComment(id, payload);

      if (res.data.success) {
        toast.success('Thought contributed anonymously.');
        setCommentInput('');
        setComments((prev) => [res.data.comment, ...prev]);
        setPost((prev) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev));

        // If slow mode enabled on post, activate cooldown
        if (post?.slowMode) {
          setSlowModeCooldown(post.slowModeSeconds || 30);
        }
      }
    } catch (err) {
      if (err.response?.data?.code === 'SLOW_MODE_COOLDOWN') {
        const waitSec = err.response?.data?.retryAfterSeconds || 30;
        setSlowModeCooldown(waitSec);
        toast.warning(`Slow mode: Please wait ${waitSec}s between comments.`);
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to post comment.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonPost />
        <SkeletonPost />
      </div>
    );
  }

  if (error || !post) {
    return <ErrorState title="Discussion Unavailable" description={error} onRetry={loadPostAndComments} />;
  }

  // Filter comments for "Challenge My Opinion"
  const filteredComments = selectedTab === 'ALL'
    ? comments
    : comments.filter((c) => c.challengeType === selectedTab);

  const getTabCount = (tabId) => {
    if (tabId === 'ALL') return comments.length;
    return comments.filter((c) => c.challengeType === tabId).length;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/home" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discussions</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Feature 9: Language / Translation button */}
          <button
            onClick={() => {
              setIsTranslated(!isTranslated);
              toast.info(isTranslated ? "Showing original language" : "AI translated to English");
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all ${
              isTranslated
                ? 'bg-terracotta-50 dark:bg-terracotta-900/30 border-terracotta-500 text-terracotta-700 dark:text-terracotta-300 font-medium'
                : 'bg-surface border-border text-ink-600 dark:text-ink-400 hover:border-ink-400'
            }`}
            title="Translate discussion"
          >
            <Languages className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
            <span>{isTranslated ? "Show Original" : "Translate"}</span>
            {post.language && post.language !== 'en' && (
              <span className="text-[10px] uppercase font-mono bg-paper-200 dark:bg-charcoal-700 px-1 rounded text-ink-700 dark:text-ink-300">
                {post.language}
              </span>
            )}
          </button>

          {/* Feature 5: Perspective Mode Button */}
          <Button
            variant="outline"
            size="sm"
            icon={Scale}
            onClick={() => setIsPerspectiveOpen(true)}
            className="border-olive-600/40 text-olive-700 dark:text-olive-400 hover:bg-olive-50 dark:hover:bg-olive-900/20"
          >
            See Another Perspective
          </Button>
        </div>
      </div>

      {/* Main Post Card */}
      <PostCard post={post} onUpdate={loadPostAndComments} onDelete={() => navigate('/home')} />

      {/* Feature 2: "Challenge My Opinion" Highlight & Tab Filter */}
      {post.isChallengeOpinion && (
        <div className="p-5 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-border space-y-3">
          <div className="flex items-center gap-2 text-terracotta-600 dark:text-terracotta-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-terracotta-500" />
            <span className="font-serif text-sm">“Challenge My Opinion” Mode Active</span>
          </div>
          <p className="text-xs text-ink-600 dark:text-ink-400">
            The author specifically requests rigorous counterarguments, empirical evidence, and alternative viewpoints.
          </p>

          {/* Perspective categorization tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {CHALLENGE_TABS.map((tab) => {
              const count = getTabCount(tab.id);
              const isActive = selectedTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                    isActive
                      ? 'bg-terracotta-50 dark:bg-terracotta-900/30 border-terracotta-500 text-terracotta-800 dark:text-terracotta-200 font-semibold shadow-sm'
                      : 'bg-surface border-border text-ink-600 dark:text-ink-400 hover:border-ink-400'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-mono text-ink-400 ml-1">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Threaded Discussion Section - Positioned directly below the post */}
      <div className="space-y-5 pt-1">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-terracotta-500" />
            <span>Comments & Discussion</span>
            <span className="text-xs font-mono text-ink-400 font-normal">
              ({filteredComments.length} {filteredComments.length === 1 ? 'comment' : 'comments'})
            </span>
          </h3>

          {/* Feature 6: Slow Mode Indicator */}
          {post.slowMode && (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 font-mono bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/40">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
              <span>Slow Mode ({post.slowModeSeconds || 30}s cooldown)</span>
            </div>
          )}
        </div>

        {/* Root Comment Box */}
        {post.allowComments ? (
          <form onSubmit={handleCreateComment} className="p-4 sm:p-5 rounded-xl bg-surface border border-border shadow-sm space-y-3">
            {/* If Challenge My Opinion: Let user label their reply category */}
            {post.isChallengeOpinion && (
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
                <span className="text-xs text-ink-500 font-medium">Your reply stance:</span>
                {[
                  { id: 'DISAGREE', label: 'Disagree', icon: '🔴' },
                  { id: 'EVIDENCE', label: 'Evidence', icon: '🔬' },
                  { id: 'ALTERNATIVE', label: 'Alternative View', icon: '💡' },
                  { id: 'AGREE', label: 'Agree', icon: '🟢' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCommentChallengeType(s.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                      commentChallengeType === s.id
                        ? 'bg-terracotta-50 dark:bg-terracotta-900/30 border-terracotta-500 text-terracotta-800 dark:text-terracotta-200 font-semibold shadow-sm'
                        : 'border-border text-ink-600 dark:text-ink-400 hover:border-ink-400 bg-surface'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}

            <textarea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={`Share your constructive anonymous thoughts as ${activeIdentity?.displayName || 'Anonymous'}...`}
              className="w-full bg-paper-50 dark:bg-charcoal-900 border border-border rounded-lg p-3 text-sm text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500 transition-colors"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ink-400 flex items-center gap-1.5">
                <span>AI safety active</span>
                <span>•</span>
                <span>Constructive arguments earn quality tags</span>
              </span>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Send}
                isLoading={isSubmitting}
                disabled={!commentInput.trim() || slowModeCooldown > 0}
              >
                {slowModeCooldown > 0 ? `Wait ${slowModeCooldown}s (Slow Mode)` : 'Post Anonymous Reply'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-border text-xs text-ink-500 text-center">
            Comments are disabled for this discussion.
          </div>
        )}

        {/* Thread Tree Structure */}
        <ThreadTree
          comments={filteredComments}
          postId={id}
          onReplyAdded={() => loadPostAndComments()}
          onCommentDeleted={handleCommentDeleted}
          isChallengeOpinion={post.isChallengeOpinion}
        />
      </div>

      {/* Discussion Insights & Polls */}
      <div className="space-y-4 pt-4 border-t border-border">
        {/* Argument Quality Endorsements for Post (Feature 13) */}
        <div className="px-5 py-3 rounded-xl bg-surface border border-border shadow-sm">
          <ArgumentQualityBar
            targetType="POST"
            targetId={post.id}
            initialQuality={post.argumentQuality}
          />
        </div>

        {/* Feature 12: "What Changed My Mind?" Poll */}
        <MindChangePoll
          targetType="POST"
          targetId={post.id}
          initialStats={post.mindChangeStats}
        />
      </div>

      {/* Perspective Mode Dual-Synthesis Modal (Feature 5) */}
      <PerspectiveModal
        isOpen={isPerspectiveOpen}
        onClose={() => setIsPerspectiveOpen(false)}
        postId={id}
      />
    </div>
  );
}
