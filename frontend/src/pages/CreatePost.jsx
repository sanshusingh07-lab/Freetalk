import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { topicService, postService, aiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Avatar } from '../components/identity/Avatar.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { 
  MessageSquare, 
  HelpCircle, 
  Vote, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  EyeOff, 
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  Wand2,
  Paperclip,
  Globe,
  Turtle,
  BookOpen,
  Lightbulb,
  Newspaper,
  Flame,
  Edit3
} from 'lucide-react';

export function CreatePost() {
  const { activeIdentity, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [postType, setPostType] = useState('DISCUSSION'); // DISCUSSION, QUESTION, POLL, IMAGE, LINK
  const [statementType, setStatementType] = useState('OPINION'); // OPINION, FACT, QUESTION, IDEA, INFORMATION
  const [isChallengeOpinion, setIsChallengeOpinion] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topicId, setTopicId] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [allowComments, setAllowComments] = useState(true);
  const [useTemporaryIdentity, setUseTemporaryIdentity] = useState(false);

  // Evidence & Source (Feature 4)
  const [showSourceFields, setShowSourceFields] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState('ARTICLE');

  // Slow Mode & Language (Feature 6 & 9)
  const [slowMode, setSlowMode] = useState(false);
  const [language, setLanguage] = useState('en');

  // "Before You Post" Safety Modal (Feature 8)
  const [showBeforeYouPostModal, setShowBeforeYouPostModal] = useState(false);
  const [hasConfirmedAggressive, setHasConfirmedAggressive] = useState(false);

  const [topics, setTopics] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real-time debounced AI Safety & Negativity prediction
  useEffect(() => {
    if (!content.trim() && !title.trim()) {
      setAiAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsAnalyzing(true);
        const res = await aiService.predictContent(content.trim(), title.trim());
        if (res.data.success) {
          setAiAnalysis(res.data.data);
        }
      } catch (err) {
        // Fallback silently
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, title]);

  const handleAutoClean = () => {
    if (aiAnalysis?.cleanedContent) {
      setContent(aiAnalysis.cleanedContent);
      toast.success("Harmful and prohibited terms cleaned automatically.");
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await topicService.getTopics();
      if (res.data.success && res.data.topics.length > 0) {
        setTopics(res.data.topics);
        setTopicId(res.data.topics[0].id);
      }
    } catch (err) {
      // silent
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !topicId) {
      toast.error("Please fill in the title, content, and select a topic.");
      return;
    }

    if (aiAnalysis && !aiAnalysis.isSafe) {
      toast.error(`Cannot publish: Prohibited content detected (${aiAnalysis.detectedBadwords?.join(', ') || 'Abusive language'}). Please remove prohibited terms or click Auto-Clean.`);
      return;
    }

    // Feature 8: "Before You Post" Safety Check
    if (!hasConfirmedAggressive && aiAnalysis?.requiresConfirmation) {
      setShowBeforeYouPostModal(true);
      return;
    }

    const hashtags = hashtagsStr
      .split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);

      let payload;
      if (mediaFile) {
        payload = new FormData();
        payload.append('title', title.trim());
        payload.append('content', content.trim());
        payload.append('topicId', topicId);
        payload.append('postType', postType);
        payload.append('statementType', statementType);
        payload.append('isChallengeOpinion', String(Boolean(isChallengeOpinion)));
        if (sourceUrl.trim()) {
          payload.append('sourceUrl', sourceUrl.trim());
          payload.append('sourceTitle', sourceTitle.trim() || '');
          payload.append('sourceType', sourceType);
        }
        payload.append('slowMode', String(Boolean(slowMode)));
        payload.append('language', language);
        payload.append('allowComments', String(Boolean(allowComments)));
        payload.append('useTemporaryIdentity', String(Boolean(useTemporaryIdentity)));
        payload.append('hashtags', JSON.stringify(hashtags));
        hashtags.forEach(h => payload.append('hashtags[]', h));
        payload.append('media', mediaFile);
      } else {
        payload = {
          title: title.trim(),
          content: content.trim(),
          topicId,
          postType,
          statementType,
          isChallengeOpinion: Boolean(isChallengeOpinion),
          sourceUrl: sourceUrl.trim() || null,
          sourceTitle: sourceTitle.trim() || null,
          sourceType: sourceUrl.trim() ? sourceType : null,
          slowMode: Boolean(slowMode),
          language,
          hashtags,
          allowComments: Boolean(allowComments),
          useTemporaryIdentity: Boolean(useTemporaryIdentity)
        };
      }

      const res = await postService.createPost(payload);

      if (res.data.status === 'PENDING_REVIEW') {
        toast.warning("Discussion flagged by AI safety filters and is pending moderator review.");
        navigate('/activity');
      } else {
        toast.success("Discussion published anonymously.");
        navigate(`/post/${res.data.post.id}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to publish discussion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/home" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Cancel & Back to Home</span>
      </Link>

      <div className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-ink-100 tracking-tight">
              Create Anonymous Discussion
            </h1>
            <Link to="/poll/create" className="text-xs text-terracotta-600 hover:text-terracotta-700 dark:text-terracotta-400 font-semibold flex items-center gap-1">
              <Vote className="w-3.5 h-3.5" />
              <span>Create Poll Instead</span>
            </Link>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Your ideas will be read without any association to your private identity.
          </p>
        </div>

        {/* Post Type Selector */}
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'DISCUSSION', label: 'Discussion', icon: MessageSquare },
            { type: 'QUESTION', label: 'Question', icon: HelpCircle },
            { type: 'IMAGE', label: 'Media', icon: ImageIcon },
            { type: 'LINK', label: 'Link / Resource', icon: LinkIcon },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setPostType(type)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                postType === type
                  ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/20 text-terracotta-700 dark:text-terracotta-300 shadow-sm'
                  : 'border-border bg-surface text-ink-600 dark:text-ink-400 hover:border-ink-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Fact vs Opinion Statement Classification (Feature 3) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">
            Statement Classification (Fact vs Opinion)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { type: 'OPINION', label: '💭 Opinion', desc: 'Subjective view' },
              { type: 'FACT', label: '📚 Fact', desc: 'Verifiable claim' },
              { type: 'QUESTION', label: '❓ Question', desc: 'Inquiry / Prompt' },
              { type: 'IDEA', label: '💡 Idea', desc: 'Proposal or thesis' },
              { type: 'INFORMATION', label: '📰 Info', desc: 'News or data' },
            ].map(({ type, label, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setStatementType(type);
                  if (type === 'FACT' || type === 'INFORMATION') {
                    setShowSourceFields(true);
                  }
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs border transition-all text-center ${
                  statementType === type
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/20 text-terracotta-800 dark:text-terracotta-200 font-semibold shadow-sm'
                    : 'border-border bg-surface text-ink-600 dark:text-ink-400 hover:border-ink-400'
                }`}
              >
                <span className="font-bold">{label}</span>
                <span className="text-[10px] text-ink-400 mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* "Challenge My Opinion" Toggle (Feature 2) */}
        <div className="p-3.5 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-border flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink-800 dark:text-ink-200">
              <Flame className="w-3.5 h-3.5 text-terracotta-500" />
              <span>Enable "Challenge My Opinion"</span>
            </div>
            <p className="text-[11px] text-ink-500 mt-0.5">
              Invites readers to challenge your thesis. Replies are grouped into Agree, Disagree, Evidence, and Alternative views.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsChallengeOpinion(!isChallengeOpinion)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
              isChallengeOpinion
                ? 'bg-terracotta-600 text-white border-terracotta-600 shadow-sm'
                : 'bg-surface text-ink-600 border-border hover:border-ink-400'
            }`}
          >
            {isChallengeOpinion ? "Active" : "Disabled"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
              Topic Community
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-xs text-ink-900 dark:text-ink-100 focus:outline-none focus:border-terracotta-500 transition-colors"
              required
            >
              {topics.map(t => (
                <option key={t.id} value={t.id} className="bg-surface text-ink-900 dark:text-ink-100">
                  #{t.name} — {t.description.substring(0, 40)}...
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <Input
            label="Title (Thought, thesis, or question)"
            placeholder="e.g. Will AI make programmers more productive or replace them?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
              Elaboration & Perspective
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Present your argument, reasoning, and context with clarity..."
              className="w-full bg-surface border border-border rounded-lg p-3.5 text-sm text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500 transition-colors"
              required
            />
          </div>

          {/* In-Built AI Safety & Tone Monitor */}
          {(content.trim().length > 0 || isAnalyzing) && (
            <div className={`p-3.5 rounded-lg border transition-all text-xs ${
              isAnalyzing 
                ? 'bg-paper-100 dark:bg-charcoal-800 border-border text-ink-600 dark:text-ink-300' 
                : aiAnalysis && !aiAnalysis.isSafe
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                  : aiAnalysis?.negativityScore > 0.45
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                    : 'bg-olive-50 dark:bg-olive-950/30 border-olive-200 dark:border-olive-900/50 text-olive-800 dark:text-olive-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 text-terracotta-500 animate-spin" />
                      <span>AI Safety Scanner evaluating tone & terms...</span>
                    </>
                  ) : aiAnalysis && !aiAnalysis.isSafe ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Prohibited Content Flagged</span>
                    </>
                  ) : aiAnalysis?.negativityScore > 0.45 ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Elevated Negativity Detected</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-olive-600 shrink-0" />
                      <span>AI Safety Verified: Constructive & Compliant</span>
                    </>
                  )}
                </div>

                {aiAnalysis && !isAnalyzing && (
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="opacity-80">Negativity: {Math.round(aiAnalysis.negativityScore * 100)}%</span>
                  </div>
                )}
              </div>

              {/* Badwords Alert & Auto-Clean Action */}
              {!isAnalyzing && aiAnalysis && !aiAnalysis.isSafe && (
                <div className="mt-2.5 pt-2 border-t border-rose-200 dark:border-rose-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-rose-700 dark:text-rose-300">
                    Detected prohibited terms: <strong className="font-bold">{aiAnalysis.detectedBadwords?.join(', ')}</strong>. FreeTalk will automatically block this post if published.
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoClean}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow transition-colors shrink-0"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Auto-Clean Text</span>
                  </button>
                </div>
              )}

              {/* Constructive Negativity Warning */}
              {!isAnalyzing && aiAnalysis && aiAnalysis.isSafe && aiAnalysis.negativityScore > 0.45 && (
                <div className="mt-2 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                  Tip: Arguments framed around ideas and evidence receive significantly more constructive replies and community reputation than aggressive phrasing.
                </div>
              )}
            </div>
          )}

          {/* Optional Image Upload */}
          {postType === 'IMAGE' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                Attach Image (Optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleMediaChange}
                className="w-full text-xs text-ink-600 dark:text-ink-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-paper-200 dark:file:bg-charcoal-700 file:text-ink-800 dark:file:text-ink-200 hover:file:bg-paper-300"
              />
              {mediaPreview && (
                <div className="mt-3 rounded-lg overflow-hidden max-h-48 border border-border">
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Hashtags */}
          <Input
            label="Hashtags (Space or comma separated)"
            placeholder="ai, futureofwork, philosophy"
            value={hashtagsStr}
            onChange={(e) => setHashtagsStr(e.target.value)}
          />

          {/* Source / Evidence Attachment (Feature 4) */}
          <div className="p-4 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-800 dark:text-ink-200">
                <Paperclip className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
                <span>Source & Evidence Citation</span>
                <span className="text-[10px] text-ink-400 font-normal">(Encourages fact-based claims)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSourceFields(!showSourceFields)}
                className="text-[11px] text-terracotta-600 hover:text-terracotta-700 dark:text-terracotta-400 font-semibold"
              >
                {showSourceFields ? "Hide" : "+ Attach Source / Paper"}
              </button>
            </div>

            {showSourceFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="sm:col-span-2">
                  <Input
                    label="Source URL (Article, Research Paper, Dataset, Website)"
                    placeholder="https://doi.org/... or https://..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Source Title / Citation"
                    placeholder="e.g. Nature Science (2026), MIT Review"
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                    Source Type
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-xs text-ink-900 dark:text-ink-100 focus:outline-none focus:border-terracotta-500"
                  >
                    <option value="ARTICLE">Article / Publication</option>
                    <option value="RESEARCH_PAPER">Research Paper</option>
                    <option value="WEBSITE">Website / Resource</option>
                    <option value="DOCUMENT">Official Report / Document</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Discussion Settings: Slow Mode (Feature 6) & Language (Feature 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-border">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
                  <span>Discussion Language</span>
                </span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-xs text-ink-900 dark:text-ink-100 focus:outline-none focus:border-terracotta-500"
              >
                <option value="en">English (Global)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="other">Other Language</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 text-xs text-ink-700 dark:text-ink-300 cursor-pointer select-none p-2.5 rounded-lg bg-surface border border-border hover:border-ink-400 transition-colors">
                <input
                  type="checkbox"
                  checked={slowMode}
                  onChange={(e) => setSlowMode(e.target.checked)}
                  className="rounded bg-surface border-border text-terracotta-600 focus:ring-terracotta-500"
                />
                <span className="flex items-center gap-1.5 font-semibold">
                  <Turtle className="w-4 h-4 text-olive-600 dark:text-olive-400" />
                  <span>Slow Mode (30s Cooldown)</span>
                </span>
              </label>
            </div>
          </div>

          {/* Anonymity & Identity Controls (Section 56) */}
          <div className="p-4 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-border space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Identity & Privacy Layer
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  seed={useTemporaryIdentity ? 'disappearing-temp' : (activeIdentity?.avatarSeed || 'anon')}
                  shape={activeIdentity?.avatarShape || 'geometric'}
                  color={activeIdentity?.avatarColor || '#C45A3C'}
                  size="sm"
                />
                <div>
                  <div className="text-xs font-bold text-ink-800 dark:text-ink-200">
                    {useTemporaryIdentity ? "Disappearing Temporary Identity" : (activeIdentity?.displayName || "Anonymous Fox")}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {useTemporaryIdentity 
                      ? "This post will NOT be linked to your other discussions" 
                      : "Your persistent anonymous persona"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUseTemporaryIdentity(!useTemporaryIdentity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  useTemporaryIdentity
                    ? 'bg-olive-600 text-white border-olive-600 shadow-sm'
                    : 'bg-surface text-ink-700 dark:text-ink-300 border-border hover:border-ink-400'
                }`}
              >
                {useTemporaryIdentity ? "Disappearing Active" : "Use Temporary Alias"}
              </button>
            </div>

            <label className="flex items-center gap-2 pt-2 border-t border-border text-xs text-ink-600 dark:text-ink-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
                className="rounded bg-surface border-border text-terracotta-600 focus:ring-terracotta-500"
              />
              <span>Allow anonymous replies and threaded debate on this post</span>
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Publish Anonymous Thought
            </Button>
          </div>
        </form>
      </div>

      {/* "Before You Post" Safety Modal (Feature 8) */}
      <Modal
        isOpen={showBeforeYouPostModal}
        onClose={() => setShowBeforeYouPostModal(false)}
        title="Before You Post: Tone Advisory"
      >
        <div className="space-y-4 text-xs text-ink-700 dark:text-ink-300">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">This message may come across as aggressive or hostile.</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                FreeTalk encourages challenging ideas, not people. Arguments framed objectively receive 3x higher community engagement and constructive replies.
              </p>
            </div>
          </div>

          <p>How would you like to proceed?</p>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={Edit3}
              onClick={() => setShowBeforeYouPostModal(false)}
              className="flex-1"
            >
              ✏️ Edit Message
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => {
                setHasConfirmedAggressive(true);
                setShowBeforeYouPostModal(false);
                setTimeout(() => {
                  document.querySelector('form')?.requestSubmit();
                }, 50);
              }}
              className="flex-1"
            >
              Post Anyway
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
