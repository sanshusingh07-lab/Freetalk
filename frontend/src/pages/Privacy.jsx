import React from 'react';
import { Shield, Lock, EyeOff, FileText } from 'lucide-react';

export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Privacy Policy & Architecture
        </h1>
        <p className="text-sm text-ink-600 dark:text-ink-300 max-w-xl mx-auto font-sans">
          We believe privacy is a fundamental human right. Here is our architectural guarantee.
        </p>
      </div>

      <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle space-y-6 text-sm text-ink-700 dark:text-ink-200 leading-relaxed font-sans">
        <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-terracotta-600 dark:text-terracotta-400" />
          1. Strict Separation of Credentials
        </h3>
        <p>
          Your account has an internal identifier used solely for authentication and abuse prevention. When you participate in discussions, only your randomly generated anonymous identity (e.g., <strong className="text-terracotta-700 dark:text-terracotta-300">Anonymous Fox</strong>) is exposed. Your email address and internal IDs are never included in public API payloads.
        </p>

        <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2 pt-4 border-t border-paper-100 dark:border-ink-800">
          <EyeOff className="w-5 h-5 text-olive-600 dark:text-olive-400" />
          2. Zero Telemetry & Ad Tracking
        </h3>
        <p>
          FreeTalk does not monetize user data, sell attention to ad networks, or implement invasive behavioral trackers. We do not require your real name, phone number, physical address, or contacts.
        </p>

        <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2 pt-4 border-t border-paper-100 dark:border-ink-800">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          3. Complete Data Autonomy
        </h3>
        <p>
          Under our Privacy Center, you can at any time download your full data archive as a structured JSON file, or permanently purge your account and private credentials with a single click.
        </p>
      </div>
    </div>
  );
}
