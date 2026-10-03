import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Trash2, 
  AlertTriangle, 
  UserX, 
  X, 
  Cpu, 
  Flame 
} from 'lucide-react';

export function ModerationQueue() {
  const { toast } = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await adminService.getModerationQueue();
      if (res.data.success) {
        setQueue(res.data.queue);
      }
    } catch (err) {
      toast.error("Failed to load moderation queue.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId, actionType, notes = '') => {
    try {
      setActionLoadingId(reportId);
      const res = await adminService.takeModerationAction(reportId, { actionType, notes });
      if (res.data.success) {
        toast.success(res.data.message);
        setQueue(prev => prev.filter(item => item.id !== reportId));
      }
    } catch (err) {
      toast.error(err.message || "Failed to apply moderation action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1 font-mono">
            <ShieldAlert className="w-4 h-4" />
            <span>Staff Safety Queue</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
            Moderation Queue
          </h1>
          <p className="text-xs text-ink-600 dark:text-ink-300 mt-1 font-sans">
            Review reported discussions, comments, and automated AI safety flags.
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{queue.length}</div>
          <div className="text-[11px] text-ink-500 dark:text-ink-400 uppercase tracking-wider font-mono">Pending Review</div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-ink-500 dark:text-ink-400">Loading moderation queue...</div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Moderation queue is clear!"
          description="All flagged content and community reports have been resolved."
        />
      ) : (
        <div className="space-y-4">
          {queue.map(item => (
            <div
              key={item.id}
              className="p-6 rounded-xl border border-paper-200 dark:border-ink-800 space-y-4 bg-white dark:bg-charcoal-850 shadow-subtle"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-paper-100 dark:bg-charcoal-800 text-ink-700 dark:text-ink-300 border border-paper-200 dark:border-charcoal-700">
                    Report #{item.id.substring(0, 8)}
                  </span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                    {item.reason}
                  </span>
                  <span className="text-ink-500 dark:text-ink-400 text-xs font-mono">• Target: {item.targetType}</span>
                </div>

                {/* AI Safety Metrics (Section 30) */}
                <div className="flex items-center gap-2 text-xs">
                  <div className={`px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1.5 ${
                    item.aiMetrics.riskLevel === 'HIGH'
                      ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                      : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                  }`}>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>AI Risk: {Math.round(item.aiMetrics.toxicityScore * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Reported Content Preview */}
              <div className="p-4 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 space-y-1.5">
                {item.title && (
                  <div className="text-sm font-bold text-ink-900 dark:text-ink-100">"{item.title}"</div>
                )}
                <p className="text-xs text-ink-800 dark:text-ink-200 leading-relaxed italic">
                  "{item.content}"
                </p>
                <div className="text-[11px] text-ink-500 dark:text-ink-400 pt-1 flex items-center justify-between font-mono">
                  <span>Author Persona: <strong className="text-ink-900 dark:text-ink-100">{item.authorIdentityName}</strong></span>
                  {item.explanation && <span>User Flag Note: {item.explanation}</span>}
                </div>
              </div>

              {/* Moderation Actions (Section 34) */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-paper-100 dark:border-ink-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(item.id, 'DISMISS')}
                  disabled={actionLoadingId === item.id}
                >
                  Dismiss Report
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAction(item.id, 'APPROVE')}
                  disabled={actionLoadingId === item.id}
                >
                  Approve (Safe)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(item.id, 'WARN', 'Please abide by respectful disagreement guidelines.')}
                  disabled={actionLoadingId === item.id}
                  className="text-amber-400 hover:text-amber-300 border-amber-500/30"
                >
                  Warn Author
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleAction(item.id, 'REMOVE')}
                  disabled={actionLoadingId === item.id}
                  icon={Trash2}
                >
                  Remove Content
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleAction(item.id, 'SUSPEND')}
                  disabled={actionLoadingId === item.id}
                  icon={UserX}
                  className="bg-rose-800 hover:bg-rose-700"
                >
                  Suspend Account
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
