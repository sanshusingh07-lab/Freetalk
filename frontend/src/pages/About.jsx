import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, EyeOff, MessageSquare, Zap, HeartHandshake } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Ideas Over Identity.
        </h1>
        <p className="text-base text-ink-600 dark:text-ink-300 max-w-2xl mx-auto leading-relaxed font-sans">
          FreeTalk was built on a foundational conviction: when who you are is hidden, what you say is all that counts.
        </p>
      </div>

      <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 space-y-6 bg-white dark:bg-charcoal-850 shadow-subtle">
        <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-ink-100">The Problem with Modern Social Media</h2>
        <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed font-sans">
          Contemporary platforms are engineered around personal brands, vanity metrics, follower counts, and outrage optimization. Individuals often withhold unconventional questions or genuine doubts out of fear of professional retribution or reputational damage. Alternatively, popular influencers are blindly agreed with regardless of argument quality.
        </p>

        <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-ink-100 pt-4 border-t border-paper-100 dark:border-ink-800">
          The FreeTalk Philosophy
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 space-y-2">
            <div className="flex items-center gap-2 text-terracotta-700 dark:text-terracotta-400 font-semibold text-sm">
              <EyeOff className="w-4 h-4" />
              <span>Identity Detachment</span>
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed font-sans">
              No profile photos, no follower counts, and no vanity rankings. Users interact via abstract identities like Anonymous Fox or Anonymous Moon.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 space-y-2">
            <div className="flex items-center gap-2 text-olive-700 dark:text-olive-400 font-semibold text-sm">
              <Shield className="w-4 h-4" />
              <span>Responsible Anonymity</span>
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed font-sans">
              Anonymity without abuse. Our platform utilizes offline AI moderation and transparent reporting to keep conversations safe and constructive.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-paper-100 dark:border-ink-800 text-center">
          <Link to="/register">
            <Button variant="primary" size="md">
              Join FreeTalk Today
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
