import React, { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { safetyService } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ShieldAlert } from 'lucide-react';

const REASONS = [
  { value: 'HARASSMENT', label: 'Harassment & Bullying' },
  { value: 'HATE_SPEECH', label: 'Hate Speech & Bigotry' },
  { value: 'THREAT', label: 'Threats & Violence' },
  { value: 'PRIVACY_VIOLATION', label: 'Doxxing / Privacy Violation' },
  { value: 'SPAM', label: 'Spam, Scams & Promotional Abuse' },
  { value: 'MISINFORMATION', label: 'Harmful Misinformation' },
  { value: 'EXPLICIT', label: 'Explicit / Inappropriate Content' },
  { value: 'OTHER', label: 'Other Guideline Violation' }
];

export function ReportModal({ isOpen, onClose, targetId, targetType = 'POST', targetTitle = '' }) {
  const { toast } = useToast();
  const [reason, setReason] = useState('HARASSMENT');
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await safetyService.report({
        targetId,
        targetType,
        reason,
        explanation
      });

      if (res.data.success) {
        toast.success(res.data.message || "Report filed. Thank you for keeping FreeTalk safe.");
        onClose();
        setExplanation('');
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report to Moderation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
          <span>
            FreeTalk preserves anonymity while strictly enforcing accountability. Reports are prioritized by automated AI risk scores and reviewed by human stewards.
          </span>
        </div>

        {targetTitle && (
          <div className="text-xs text-ink-600 dark:text-ink-400">
            Reporting: <span className="text-ink-900 dark:text-ink-100 font-semibold italic">"{targetTitle}"</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-300 mb-2">
            Reason for report
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REASONS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={`p-2.5 text-left text-xs rounded-xl border transition-all ${
                  reason === r.value
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 font-semibold shadow-sm'
                    : 'border-paper-200 dark:border-charcoal-700 bg-paper-50 dark:bg-charcoal-800 hover:border-paper-300 dark:hover:border-charcoal-600 text-ink-700 dark:text-ink-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-300 mb-1.5">
            Explanation (Optional)
          </label>
          <textarea
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Help our moderators understand what violated the guidelines..."
            className="w-full bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-xl p-3 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-paper-100 dark:border-ink-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
