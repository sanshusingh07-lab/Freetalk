import React, { useState } from 'react';
import { featureService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../ui/Button.jsx';
import { X, Scale, PlusCircle } from 'lucide-react';

export function CreateDebateModal({ isOpen, onClose, onSuccess }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    topic: '',
    category: 'Technology',
    sideATitle: '',
    sideAContent: '',
    sideBTitle: '',
    sideBContent: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning("Please log in to initiate a blind debate.");
      return;
    }

    if (!formData.topic.trim() || !formData.sideATitle.trim() || !formData.sideAContent.trim() || !formData.sideBTitle.trim() || !formData.sideBContent.trim()) {
      toast.error("Please fill in all debate thesis and argument fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await featureService.createDebate(formData);
      if (res.data.success) {
        toast.success("Blind debate launched! Neutral aliases assigned.");
        onSuccess(res.data.debate);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create debate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-paper-200 dark:border-ink-700 bg-white dark:bg-charcoal-850 shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-100 dark:border-ink-800 bg-paper-50 dark:bg-charcoal-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200 dark:border-terracotta-800/60 text-terracotta-600 dark:text-terracotta-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-ink-900 dark:text-ink-100">Launch Blind Debate</h3>
              <p className="text-xs text-ink-600 dark:text-ink-300">
                Randomized anonymous aliases will be assigned to both sides.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">
              Debate Topic / Core Question *
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g. Is remote work superior to in-office collaboration?"
              className="w-full bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-lg px-3.5 py-2 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-lg px-3.5 py-2 text-xs text-ink-900 dark:text-ink-100 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
            >
              <option value="Technology">Technology</option>
              <option value="Philosophy">Philosophy & Ethics</option>
              <option value="Society">Society & Culture</option>
              <option value="Work & Careers">Work & Careers</option>
              <option value="Education">Education</option>
              <option value="Economics">Economics</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Side A */}
            <div className="p-4 rounded-xl bg-terracotta-50/40 dark:bg-terracotta-950/20 border border-terracotta-200 dark:border-terracotta-900/50 space-y-3">
              <span className="text-xs font-bold text-terracotta-700 dark:text-terracotta-300 block font-mono">
                Perspective A (Random Alias)
              </span>
              <div>
                <label className="block text-[11px] text-ink-600 dark:text-ink-300 mb-1">Thesis Title *</label>
                <input
                  type="text"
                  name="sideATitle"
                  value={formData.sideATitle}
                  onChange={handleChange}
                  placeholder="e.g. Flexibility and productivity"
                  className="w-full bg-white dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-lg p-2 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-terracotta-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink-600 dark:text-ink-300 mb-1">Key Argument & Evidence *</label>
                <textarea
                  rows={4}
                  name="sideAContent"
                  value={formData.sideAContent}
                  onChange={handleChange}
                  placeholder="Elaborate on perspective A's strongest supporting arguments..."
                  className="w-full bg-white dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-lg p-2 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-terracotta-500"
                  required
                />
              </div>
            </div>

            {/* Side B */}
            <div className="p-4 rounded-xl bg-olive-50/40 dark:bg-olive-950/20 border border-olive-200 dark:border-olive-900/50 space-y-3">
              <span className="text-xs font-bold text-olive-700 dark:text-olive-300 block font-mono">
                Perspective B (Random Alias)
              </span>
              <div>
                <label className="block text-[11px] text-ink-600 dark:text-ink-300 mb-1">Thesis Title *</label>
                <input
                  type="text"
                  name="sideBTitle"
                  value={formData.sideBTitle}
                  onChange={handleChange}
                  placeholder="e.g. Spontaneous innovation and mentorship"
                  className="w-full bg-white dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-lg p-2 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-olive-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink-600 dark:text-ink-300 mb-1">Key Argument & Evidence *</label>
                <textarea
                  rows={4}
                  name="sideBContent"
                  value={formData.sideBContent}
                  onChange={handleChange}
                  placeholder="Elaborate on perspective B's strongest counter-arguments..."
                  className="w-full bg-white dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 rounded-lg p-2 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-olive-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-100 dark:border-ink-800">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={PlusCircle}
              isLoading={isSubmitting}
            >
              Publish Blind Debate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
