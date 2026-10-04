import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../identity/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { ReportModal } from '../moderation/ReportModal.jsx';
import { commentService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { 
  CornerDownRight, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Heart, 
  Lightbulb, 
  HelpCircle, 
  Laugh, 
  Flame,
  Send,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { ArgumentQualityBar } from '../common/ArgumentQualityBar.jsx';

const CHALLENGE_BADGES = {
  AGREE: { label: 'Agree', color: 'bg-olive-50 text-olive-800 border-olive-200 dark:bg-olive-950/60 dark:text-olive-300 dark:border-olive-800/60', icon: '🟢' },
  DISAGREE: { label: 'Disagree', color: 'bg-terracotta-50 text-terracotta-800 border-terracotta-200 dark:bg-terracotta-950/60 dark:text-terracotta-300 dark:border-terracotta-800/60', icon: '🔴' },
  EVIDENCE: { label: 'Evidence', color: 'bg-paper-100 text-ink-700 border-paper-200 dark:bg-ink-800 dark:text-paper-300 dark:border-ink-700', icon: '🔬' },
  ALTERNATIVE: { label: 'Alternative View', color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60', icon: '💡' }
};

const REACTION_CONFIG = [
  { type: 'AGREE', icon: Heart, label: 'Agree' },
  { type: 'INSIGHTFUL', icon: Lightbulb, label: 'Insightful' },
  { type: 'THOUGHT_PROVOKING', icon: HelpCircle, label: 'Thought-provoking' },
  { type: 'FUNNY', icon: Laugh, label: 'Funny' },
  { type: 'STRONG_POINT', icon: Flame, label: 'Strong Point' }
];

export function CommentNode({ comment, postId, onReplyAdded, onCommentDeleted, depth = 0, isChallengeOpinion = false }) {
  const { isAuthenticated, activeIdentity, user, isStaff, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyChallengeType, setReplyChallengeType] = useState('DISAGREE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactionCounts, setReactionCounts] = useState(comment.reactionCounts || {});
  const [userReactions, setUserReactions] = useState(comment.userReactions || []);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canDelete = Boolean(
    comment.canDelete || 
    comment.isAuthor || 
    (user && (comment.userId === user.id || isStaff || isAdmin))
  );

  const handleDeleteComment = async () => {
    try {
      setIsDeleting(true);
      const res = await commentService.deleteComment(comment.id);
      if (res.data.success) {
        toast.success(isStaff && !comment.isAuthor ? "Comment deleted by moderator." : "Comment deleted.");
        if (onCommentDeleted) {
          onCommentDeleted(comment.id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete comment.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStartChat = () => {
    if (!isAuthenticated) {
      toast.warning("Please sign in to chat anonymously.");
      return;
    }
    if (!comment.identity) return;
    navigate(`/messages?recipientId=${comment.identity.id}&name=${encodeURIComponent(comment.identity.displayName)}&seed=${encodeURIComponent(comment.identity.avatarSeed || '')}&shape=${encodeURIComponent(comment.identity.avatarShape || '')}&color=${encodeURIComponent(comment.identity.avatarColor || '')}`);
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
      toast.warning("Please log in to react.");
      return;
    }

    try {
      const res = await commentService.toggleReaction(comment.id, reactionType);
      if (res.data.success) {
        setReactionCounts(res.data.reactionCounts);
        setUserReactions(res.data.userReactions);
      }
    } catch (err) {
      toast.error(err.message || "Failed to react.");
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await commentService.createComment(postId, {
        content: replyText.trim(),
        parentId: comment.id,
        challengeType: isChallengeOpinion ? replyChallengeType : undefined
      });

      if (res.data.success) {
        toast.success("Reply posted anonymously.");
        setReplyText('');
        setIsReplying(false);
        if (onReplyAdded) onReplyAdded(res.data.comment);
      }
    } catch (err) {
      toast.error(err.message || "Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={`relative ${depth > 0 ? 'ml-4 md:ml-8 pl-4 border-l-2 border-paper-200 dark:border-ink-800' : ''} my-3`}>
      {/* Visual connecting branch line */}
      {depth > 0 && (
        <div className="absolute -left-4 top-5 w-4 h-0.5 bg-paper-300 dark:bg-ink-700" />
      )}

      <div className="p-4 rounded-xl bg-white dark:bg-ink-850 border border-paper-200 dark:border-ink-800 shadow-subtle hover:border-paper-300 dark:hover:border-ink-700 transition-colors">
        {/* Author Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar
              seed={comment.identity?.avatarSeed || 'anon'}
              shape={comment.identity?.avatarShape || 'geometric'}
              color={comment.identity?.avatarColor || '#C45A3C'}
              size="sm"
            />
            <div>
              <span className="text-xs font-semibold text-ink-900 dark:text-paper-100">
                {comment.identity?.displayName || "Anonymous"}
              </span>
              <span className="text-[11px] text-ink-400 dark:text-paper-400 ml-2 font-normal">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.challengeType && CHALLENGE_BADGES[comment.challengeType] && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ml-2 ${CHALLENGE_BADGES[comment.challengeType].color}`}>
                  <span>{CHALLENGE_BADGES[comment.challengeType].icon}</span>
                  <span>{CHALLENGE_BADGES[comment.challengeType].label}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {comment.identity && comment.identity.id !== activeIdentity?.id && (
              <button
                onClick={handleStartChat}
                className="p-1 text-ink-500 dark:text-paper-400 hover:text-terracotta-600 dark:hover:text-terracotta-400 transition-colors text-xs flex items-center gap-1 rounded hover:bg-paper-100 dark:hover:bg-ink-800"
                title={`Chat privately with ${comment.identity.displayName}`}
              >
                <Send className="w-3 h-3 text-terracotta-600 dark:text-terracotta-400" />
                <span className="hidden sm:inline text-[10px]">Chat</span>
              </button>
            )}

            {hasReplies && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 text-ink-500 dark:text-paper-400 hover:text-ink-900 dark:hover:text-white transition-colors text-xs flex items-center gap-1"
                title={isCollapsed ? "Expand replies" : "Collapse thread"}
              >
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-mono">{comment.replies.length}</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                disabled={isDeleting}
                className="p-1 text-ink-400 dark:text-paper-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title={isStaff && !comment.isAuthor ? "Delete comment (Admin/Moderator)" : "Delete your comment"}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setIsReportOpen(true)}
              className="p-1 text-ink-400 dark:text-paper-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Report comment"
            >
              <ShieldAlert className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Prompt */}
        {showDeleteConfirm && (
          <div className="my-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2 text-xs animate-fade-in">
            <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-200 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span>Delete this comment permanently?</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-0.5 rounded text-ink-600 dark:text-paper-300 hover:bg-paper-200 dark:hover:bg-ink-800 text-[11px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteComment}
                disabled={isDeleting}
                className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!isCollapsed && (
          <>
            <p className="text-ink-700 dark:text-paper-200 text-sm leading-relaxed whitespace-pre-line mb-3 font-sans">
              {comment.content}
            </p>

            {/* Comment Reactions & Reply Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-paper-100 dark:border-ink-800 text-xs">
              <div className="flex items-center gap-1">
                {REACTION_CONFIG.map(({ type, icon: Icon, label }) => {
                  const count = reactionCounts[type] || 0;
                  const hasReacted = userReactions.includes(type);

                  return (
                    <button
                      key={type}
                      onClick={() => handleToggleReaction(type)}
                      className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] transition-all ${
                        hasReacted
                          ? 'bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-700 dark:text-terracotta-300 font-semibold'
                          : 'text-ink-500 dark:text-paper-400 hover:text-ink-900 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-ink-800'
                      }`}
                      title={label}
                    >
                      <Icon className="w-3 h-3" />
                      {count > 0 && <span>{count}</span>}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setIsReplying(!isReplying)}
                className="inline-flex items-center gap-1 text-xs text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold px-2 py-1 rounded hover:bg-paper-100 dark:hover:bg-ink-800"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>Reply</span>
              </button>
            </div>

            {/* Argument Quality Endorsements for Comment (Feature 13) */}
            <div className="pt-2 border-t border-paper-100 dark:border-ink-800/60">
              <ArgumentQualityBar
                targetType="COMMENT"
                targetId={comment.id}
                initialQuality={comment.argumentQuality}
              />
            </div>

            {/* Nested Reply Box */}
            {isReplying && (
              <form onSubmit={handleSendReply} className="mt-3 pt-3 border-t border-paper-100 dark:border-ink-800 space-y-2">
                {isChallengeOpinion && (
                  <div className="flex flex-wrap items-center gap-1.5 pb-1">
                    <span className="text-[11px] text-ink-600 dark:text-ink-400 mr-1">Position:</span>
                    {Object.entries(CHALLENGE_BADGES).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setReplyChallengeType(key)}
                        className={`px-2 py-0.5 text-[10px] rounded-lg border transition-all ${
                          replyChallengeType === key
                            ? 'bg-terracotta-50 dark:bg-terracotta-950/60 border-terracotta-500 text-terracotta-700 dark:text-terracotta-300 font-semibold'
                            : 'border-paper-200 dark:border-charcoal-700 text-ink-700 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white bg-paper-50 dark:bg-charcoal-800'
                        }`}
                      >
                        {info.icon} {info.label}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Replying anonymously to ${comment.identity?.displayName}...`}
                  className="w-full bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-xl p-2.5 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                    Send Reply
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Render Nested Thread Replies */}
      {!isCollapsed && hasReplies && (
        <div className="space-y-2 mt-2">
          {comment.replies.map(reply => (
            <CommentNode
              key={reply.id}
              comment={reply}
              postId={postId}
              onReplyAdded={onReplyAdded}
              onCommentDeleted={onCommentDeleted}
              depth={depth + 1}
              isChallengeOpinion={isChallengeOpinion}
            />
          ))}
        </div>
      )}

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={comment.id}
        targetType="COMMENT"
        targetTitle={comment.content.substring(0, 40) + '...'}
      />
    </div>
  );
}
export function ThreadTree({ comments = [], postId, onReplyAdded, onCommentDeleted, isChallengeOpinion = false }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-white dark:bg-charcoal-900 border border-paper-200 dark:border-ink-800 text-ink-600 dark:text-ink-300 text-sm shadow-xs">
        No comments yet. Start the conversation with your anonymous perspective.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map(c => (
        <CommentNode
          key={c.id}
          comment={c}
          postId={postId}
          onReplyAdded={onReplyAdded}
          onCommentDeleted={onCommentDeleted}
          depth={0}
          isChallengeOpinion={isChallengeOpinion}
        />
      ))}
    </div>
  );
}
