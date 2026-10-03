import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { featureService } from '../../services/api.js';
import { Button } from '../ui/Button.jsx';
import { Dices, Sparkles, X, ArrowRight, RefreshCw } from 'lucide-react';

export function RandomDiscussionModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRandomPrompt();
    }
  }, [isOpen]);

  const fetchRandomPrompt = async () => {
    try {
      setLoading(true);
      const res = await featureService.getRandomPrompt();
      if (res.data.success) {
        setPrompt(res.data.prompt);
      }
    } catch (err) {
      // Fallback
      setPrompt({
        question: "Would you rather know your future or change your past?",
        category: "Philosophy & Time",
        premise: "Consider the psychological toll of predestination versus the unintended butterfly effects of alteration."
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleJoin = () => {
    onClose();
    if (prompt?.postId) {
      navigate(`/post/${prompt.postId}`);
    } else {
      // Prefill create post
      navigate(`/create?topic=${encodeURIComponent(prompt?.category || 'General')}&title=${encodeURIComponent(prompt?.question || '')}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl border border-paper-200 dark:border-ink-700 bg-white dark:bg-charcoal-850 shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-100 dark:border-ink-800 bg-paper-50 dark:bg-charcoal-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200 dark:border-terracotta-800/60 text-terracotta-600 dark:text-terracotta-400 animate-bounce">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
                <span>Random Conversation</span>
                <span className="text-[10px] font-mono uppercase bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 px-2 py-0.5 rounded-full border border-terracotta-200 dark:border-terracotta-800/40">
                  Roulette
                </span>
              </h3>
              <p className="text-xs text-ink-600 dark:text-ink-300">Jump into unexpected, thought-provoking dialogue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-400 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white rounded-lg hover:bg-paper-100 dark:hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-terracotta-500 animate-spin mx-auto" />
              <p className="text-xs text-ink-500 dark:text-ink-400">Spinning the conversation wheel...</p>
            </div>
          ) : prompt ? (
            <div className="space-y-4">
              <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-terracotta-50 dark:bg-terracotta-950/40 border border-terracotta-200 dark:border-terracotta-800/40 text-terracotta-700 dark:text-terracotta-300">
                {prompt.category || "General Discourse"}
              </div>

              <h2 className="font-serif text-lg sm:text-xl font-bold text-ink-900 dark:text-ink-100 leading-snug">
                “{prompt.question}”
              </h2>

              {prompt.premise && (
                <div className="p-3.5 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 text-xs text-ink-700 dark:text-ink-200 leading-relaxed">
                  <span className="text-terracotta-700 dark:text-terracotta-300 font-semibold block mb-1">Perspective Angle:</span>
                  {prompt.premise}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-paper-100 dark:border-ink-800 bg-paper-50 dark:bg-charcoal-900">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchRandomPrompt}
            disabled={loading}
          >
            Spin Again 🎲
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            onClick={handleJoin}
            disabled={loading}
          >
            {prompt?.postId ? 'Jump to Discussion' : 'Start Discussion'}
          </Button>
        </div>
      </div>
    </div>
  );
}
