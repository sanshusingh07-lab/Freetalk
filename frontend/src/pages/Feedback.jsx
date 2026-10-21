import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, CheckCircle2, Sparkles, Shield, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export function Feedback() {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General Experience');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const sampleReviews = [
    {
      author: 'Anonymous Lynx',
      role: 'Verified Citizen',
      rating: 5,
      date: '2 days ago',
      category: 'Privacy',
      text: 'Finally a platform where I can discuss complex ideas without fear of workplace retribution. The identity detachment works flawlessly.'
    },
    {
      author: 'Anonymous Owl',
      role: 'Debater',
      rating: 5,
      date: '4 days ago',
      category: 'AI Assistant',
      text: 'The floating AI Assistant draft check saved me from posting an overly emotional response. It helped me rephrase constructively.'
    },
    {
      author: 'Anonymous Falcon',
      role: 'Topic Moderator',
      rating: 4,
      date: '1 week ago',
      category: 'Content Moderation',
      text: 'The balance between total anonymity and anti-abuse protection is the best I have seen across any modern social app.'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-700 dark:bg-terracotta-950/40 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800 uppercase tracking-wider font-mono">
          Community Voice
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Feedback & Reviews.
        </h1>
        <p className="text-sm sm:text-base text-ink-600 dark:text-ink-300 max-w-xl mx-auto leading-relaxed">
          FreeTalk evolves through collective insight. Tell us what you appreciate, what needs refinement, or how we can improve your anonymous experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Column: Submit Feedback Form */}
        <div className="md:col-span-3">
          <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-olive-100 dark:bg-olive-950 text-olive-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink-900 dark:text-ink-100">
                  Feedback Received!
                </h3>
                <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-300 max-w-sm mx-auto leading-relaxed">
                  Thank you for contributing your perspective. Your rating and remarks help guide our ongoing development and privacy updates.
                </p>
                <Button variant="secondary" size="sm" onClick={() => { setSubmitted(false); setComment(''); }}>
                  Submit Additional Feedback
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-ink-100">Rate Your Experience</h2>

                {/* Star Rating Picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono">Overall Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-amber-400 hover:scale-125 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-paper-300 dark:text-charcoal-600'}`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono text-xs font-bold text-ink-700 dark:text-ink-200">
                      {rating} of 5 Stars
                    </span>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono">Area of Feedback</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-paper-50 dark:bg-charcoal-900 text-xs text-ink-900 dark:text-ink-100 focus:outline-none focus:border-terracotta-500"
                  >
                    <option value="General Experience">General Platform Experience</option>
                    <option value="AI Assistant">FreeTalk AI Assistant</option>
                    <option value="Privacy & Shielding">Privacy & Identity Shielding</option>
                    <option value="Content Moderation">Content Moderation & Safety</option>
                    <option value="Blind Debates">Blind Debates & Voting</option>
                    <option value="Feature Suggestion">Feature Suggestion</option>
                  </select>
                </div>

                {/* Comments Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono">Your Thoughts & Suggestions</label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What do you enjoy most? What can we refine or add?"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-paper-50 dark:bg-charcoal-900 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500 resize-y"
                  />
                </div>

                <Button type="submit" variant="primary" size="md" className="w-full justify-center">
                  <ThumbsUp className="w-4 h-4 mr-1.5" /> Submit Feedback
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Community Highlights */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-6 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 space-y-4 shadow-subtle">
            <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">Platform Satisfaction</h3>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-border">
              <span className="font-serif text-4xl font-bold text-ink-900 dark:text-ink-100">4.9</span>
              <div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-ink-500">Based on 1,420+ anonymous reviews</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 font-mono block">Recent Community Feedback:</span>
              {sampleReviews.map((rev, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-800 dark:text-ink-200">{rev.author}</span>
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-paper-200 dark:bg-charcoal-700 text-ink-600 dark:text-ink-300">
                    {rev.category}
                  </span>
                  <p className="text-[11px] text-ink-600 dark:text-ink-300 italic leading-relaxed">
                    "{rev.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
