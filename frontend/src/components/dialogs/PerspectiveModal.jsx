import React, { useState, useEffect } from 'react';
import { postService } from '../../services/api.js';
import { Button } from '../ui/Button.jsx';
import { X, Sparkles, Scale, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export function PerspectiveModal({ isOpen, onClose, postId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      loadPerspectives();
    }
  }, [isOpen, postId]);

  const loadPerspectives = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await postService.getPerspectives(postId);
      if (res.data.success) {
        setData(res.data.perspectives);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to generate contrasting perspectives.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-paper-200 dark:border-ink-700 bg-white dark:bg-charcoal-850 shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-100 dark:border-ink-800 bg-paper-50 dark:bg-charcoal-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200 dark:border-terracotta-800/60 text-terracotta-600 dark:text-terracotta-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
                <span>Perspective Mode</span>
                <span className="text-[10px] font-mono uppercase bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 px-2 py-0.5 rounded-full border border-terracotta-200 dark:border-terracotta-800/40">
                  Dual-Synthesis
                </span>
              </h3>
              <p className="text-xs text-ink-600 dark:text-ink-300">
                AI breakdown of contrasting viewpoints & underlying trade-offs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-400 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white rounded-lg hover:bg-paper-100 dark:hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-terracotta-500 animate-spin mx-auto" />
              <p className="text-sm text-ink-800 dark:text-ink-200 font-medium">Synthesizing discussion viewpoints...</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Extracting thesis, antithesis, and alternative nuances</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Topic Premise */}
              <div className="p-3.5 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700">
                <span className="text-[10px] font-mono text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider block mb-1">
                  Topic Analyzed
                </span>
                <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{data.topic}</h4>
              </div>

              {/* Side-by-Side Dual Perspective */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Affirming Side */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border-b border-emerald-200 dark:border-emerald-900/40 pb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{data.sideA?.title || "Affirming Points"}</span>
                  </div>
                  <ul className="space-y-2.5">
                    {data.sideA?.points?.map((pt, idx) => (
                      <li key={idx} className="text-xs text-ink-800 dark:text-ink-200 flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Counter / Alternative Side */}
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs border-b border-amber-200 dark:border-amber-900/40 pb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{data.sideB?.title || "Counter-Arguments"}</span>
                  </div>
                  <ul className="space-y-2.5">
                    {data.sideB?.points?.map((pt, idx) => (
                      <li key={idx} className="text-xs text-ink-800 dark:text-ink-200 flex items-start gap-2 leading-relaxed">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Neutral Synthesis Footer */}
              <div className="p-4 rounded-xl bg-paper-100 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-terracotta-700 dark:text-terracotta-300">
                  <Sparkles className="w-4 h-4 text-terracotta-500" />
                  <span>Perspective Synthesis</span>
                </div>
                <p className="text-xs text-ink-700 dark:text-ink-200 leading-relaxed">
                  {data.synthesis}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-paper-100 dark:border-ink-800 bg-paper-50 dark:bg-charcoal-900">
          <span className="text-[11px] text-ink-500 dark:text-ink-400 font-mono">
            Designed to prevent echo chambers & promote intellectual humility
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
