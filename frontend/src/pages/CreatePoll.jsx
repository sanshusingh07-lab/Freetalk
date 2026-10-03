import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { topicService, pollService } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Vote, Plus, Trash2, ArrowLeft, Lock } from 'lucide-react';

export function CreatePoll() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [topicId, setTopicId] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [topics, setTopics] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions(prev => [...prev, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    setOptions(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error("Please enter a question.");
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error("At least 2 non-empty poll options are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await pollService.createPoll({
        question: question.trim(),
        options: validOptions,
        topicId,
        durationDays
      });

      if (res.data.success) {
        toast.success("Anonymous poll created.");
        navigate(`/post/${res.data.postId}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create poll.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/home" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Cancel & Back</span>
      </Link>

      <div className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-terracotta-600 dark:text-terracotta-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Vote className="w-4 h-4 text-terracotta-500" />
            <span>Consensus & Inquiry</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
            Create Anonymous Poll
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Gather authentic community sentiment without public voter exposure. Duplicate voting is prevented cryptographically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
              Topic Community
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-xs text-ink-900 dark:text-ink-100 focus:outline-none focus:border-terracotta-500"
              required
            >
              {topics.map(t => (
                <option key={t.id} value={t.id} className="bg-surface text-ink-900 dark:text-ink-100">
                  #{t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question */}
          <Input
            label="Poll Question"
            placeholder="e.g. What should AI regulation focus on first?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />

          {/* Options */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">
              Poll Options (2 to 6)
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500"
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-paper-100 dark:hover:bg-charcoal-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 hover:text-terracotta-700 dark:text-terracotta-400 py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
              Poll Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 7, 14, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDurationDays(days)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    durationDays === days
                      ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/30 text-terracotta-800 dark:text-terracotta-200 font-bold'
                      : 'border-border bg-surface text-ink-600 dark:text-ink-400 hover:border-ink-400'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Launch Anonymous Poll
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
