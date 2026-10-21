import React, { useState } from 'react';
import { Mail, MessageSquare, Send, ShieldCheck, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General Inquiry',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-700 dark:bg-terracotta-950/40 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800 uppercase tracking-wider font-mono">
          Get in Touch
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Contact FreeTalk Support.
        </h1>
        <p className="text-sm sm:text-base text-ink-600 dark:text-ink-300 max-w-xl mx-auto leading-relaxed">
          Have questions about anonymity, privacy features, moderation appeals, or partnership inquiries? Our team is here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Column: Contact Cards */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-6 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 space-y-4 shadow-subtle">
            <h3 className="font-serif font-bold text-base text-ink-900 dark:text-ink-100">Direct Support</h3>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-terracotta-50 dark:bg-terracotta-900/30 text-terracotta-600 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 font-mono">Email Us</span>
                <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">support@freetalk.internal</p>
                <p className="text-[11px] text-ink-500">For general & account queries</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-olive-50 dark:bg-olive-900/30 text-olive-600 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 font-mono">Safety & Privacy</span>
                <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">safety@freetalk.internal</p>
                <p className="text-[11px] text-ink-500">Appeals, badword blocks & security</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-paper-100 dark:bg-charcoal-800 text-ink-600 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 font-mono">Response Time</span>
                <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">Within 24 Hours</p>
                <p className="text-[11px] text-ink-500">Monday through Saturday</p>
              </div>
            </div>
          </div>

          {/* AI Helper Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-terracotta-50 to-paper-100 dark:from-charcoal-800 dark:to-charcoal-850 border border-terracotta-200 dark:border-charcoal-700 space-y-2">
            <div className="flex items-center gap-2 text-terracotta-700 dark:text-terracotta-400 font-bold text-xs font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Instant AI Assistance</span>
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed">
              Need immediate answers? Click the floating circular AI Assistant on the bottom right for real-time draft safety checks and guidelines!
            </p>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="md:col-span-3">
          <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-olive-100 dark:bg-olive-950 text-olive-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink-900 dark:text-ink-100">
                  Message Transmitted!
                </h3>
                <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-300 max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out. Your query has been logged securely, and our team will get back to you shortly.
                </p>
                <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-ink-100">Send an Inquiry</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono">Your Name / Pseudonym</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Anonymous Explorer"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-paper-50 dark:bg-charcoal-900 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-paper-50 dark:bg-charcoal-900 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-paper-50 dark:bg-charcoal-900 text-xs text-ink-900 dark:text-ink-100 focus:outline-none focus:border-terracotta-500"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Moderation Appeal">Moderation Appeal</option>
                      <option value="Privacy Question">Privacy Question</option>
                      <option value="Feature Request">Feature Request</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Summary of issue"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-paper-50 dark:bg-charcoal-900 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we can help you..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-paper-50 dark:bg-charcoal-900 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:border-terracotta-500 resize-y"
                  />
                </div>

                <Button type="submit" variant="primary" size="md" className="w-full justify-center">
                  <Send className="w-4 h-4 mr-1.5" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
