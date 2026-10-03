import React, { useState, useEffect } from 'react';
import { featureService } from '../../services/api.js';
import { Avatar } from '../identity/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Sparkles, MessageCircle, Send } from 'lucide-react';

export function ThoughtOfTheDayWidget() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [thought, setThought] = useState(null);
  const [responseInput, setResponseInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetchThought();
  }, []);

  const fetchThought = async () => {
    try {
      const res = await featureService.getThoughtOfDay();
      if (res.data.success && res.data.thought) {
        setThought(res.data.thought);
      }
    } catch (err) {
      // optional
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning("Please log in to respond anonymously.");
      return;
    }
    if (!responseInput.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await featureService.respondThought(thought.id, responseInput.trim());
      if (res.data.success) {
        toast.success("Thought recorded.");
        setThought(prev => ({
          ...prev,
          responses: [res.data.response, ...(prev.responses || [])]
        }));
        setResponseInput('');
        setShowInput(false);
      }
    } catch (err) {
      toast.error(err.message || "Could not record response.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!thought) return null;

  return (
    <div className="relative overflow-hidden rounded-xl p-5 border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle mb-6">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 text-terracotta-600 dark:text-terracotta-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-terracotta-500" />
          <span>Thought of the Day</span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 font-medium border border-terracotta-200 dark:border-terracotta-800/40">
          {thought.category}
        </span>
      </div>

      <h3 className="text-base md:text-lg font-serif font-bold text-ink-900 dark:text-ink-100 mb-3 tracking-tight">
        "{thought.prompt}"
      </h3>

      {/* Responses preview */}
      {thought.responses && thought.responses.length > 0 && (
        <div className="space-y-2 mb-4">
          {thought.responses.slice(0, 2).map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 text-xs text-ink-700 dark:text-ink-200 flex items-start gap-2.5">
              <Avatar
                seed={r.identity?.avatarSeed || 'seed'}
                shape={r.identity?.avatarShape || 'geometric'}
                color={r.identity?.avatarColor || '#C45A3C'}
                size="xs"
              />
              <div className="flex-1">
                <span className="font-semibold text-ink-900 dark:text-ink-100 mr-1.5">{r.identity?.displayName}:</span>
                <span>{r.content}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input or trigger button */}
      {showInput ? (
        <form onSubmit={handleRespond} className="space-y-2">
          <textarea
            rows={2}
            value={responseInput}
            onChange={(e) => setResponseInput(e.target.value)}
            placeholder="Share your anonymous insight..."
            className="w-full bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-xl p-2.5 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" icon={Send} isLoading={isSubmitting}>
              Share Insight
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-terracotta-700 dark:text-terracotta-300 bg-terracotta-50 dark:bg-terracotta-950/40 hover:bg-terracotta-100 dark:hover:bg-terracotta-900/60 border border-terracotta-200 dark:border-terracotta-800/40 transition-all flex items-center justify-center gap-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Answer Anonymously</span>
        </button>
      )}
    </div>
  );
}
