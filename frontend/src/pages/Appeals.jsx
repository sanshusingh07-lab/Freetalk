import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Scale, CheckCircle2, XCircle } from 'lucide-react';

export function Appeals() {
  const { toast } = useToast();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoadingId, setReviewLoadingId] = useState(null);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAppeals();
      if (res.data.success) {
        setAppeals(res.data.appeals);
      }
    } catch (err) {
      toast.error("Failed to load appeals.");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (appealId, status, reviewNotes = '') => {
    try {
      setReviewLoadingId(appealId);
      const res = await adminService.reviewAppeal(appealId, { status, reviewNotes });
      if (res.data.success) {
        toast.success(res.data.message);
        setAppeals(prev => prev.filter(a => a.id !== appealId));
      }
    } catch (err) {
      toast.error(err.message || "Failed to process appeal.");
    } finally {
      setReviewLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 font-mono">
            <Scale className="w-4 h-4" />
            <span>Fair Process & Due Diligence</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
            User Appeals
          </h1>
          <p className="text-xs text-ink-600 dark:text-ink-300 mt-1 font-sans">
            Review user explanations regarding content removed by moderation.
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{appeals.length}</div>
          <div className="text-[11px] text-ink-500 dark:text-ink-400 uppercase tracking-wider font-mono">Pending Appeals</div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-ink-500 dark:text-ink-400">Loading appeals...</div>
      ) : appeals.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No pending appeals"
          description="All user appeals have been reviewed."
        />
      ) : (
        <div className="space-y-4">
          {appeals.map(a => (
            <div
              key={a.id}
              className="p-6 rounded-xl border border-paper-200 dark:border-ink-800 space-y-4 bg-white dark:bg-charcoal-850 shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-paper-100 dark:bg-charcoal-800 text-ink-700 dark:text-ink-300 border border-paper-200 dark:border-charcoal-700">
                  Appeal #{a.id.substring(0, 8)}
                </span>
                <span className="text-xs text-ink-500 dark:text-ink-400 font-mono">
                  Submitted {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* User Explanation */}
              <div className="p-4 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 space-y-1">
                <div className="text-[11px] font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                  User Argument for Reinstatement:
                </div>
                <p className="text-xs text-ink-800 dark:text-ink-200 leading-relaxed italic">
                  "{a.reason}"
                </p>
              </div>

              {/* Original Post context */}
              {a.post && (
                <div className="text-xs text-ink-600 dark:text-ink-400">
                  Original Title: <strong className="text-ink-900 dark:text-ink-100">"{a.post.title}"</strong>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-paper-100 dark:border-ink-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReview(a.id, 'REJECTED', 'Content remains in breach of community standards.')}
                  disabled={reviewLoadingId === a.id}
                >
                  Decline Appeal
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleReview(a.id, 'APPROVED', 'Reinstated upon secondary contextual review.')}
                  disabled={reviewLoadingId === a.id}
                  icon={CheckCircle2}
                >
                  Grant Appeal & Reinstate
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
