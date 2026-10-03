import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export function CommunityGuidelines() {
  const allowed = [
    { title: "Respectful Disagreement", desc: "Challenge assertions, logic, and premises with vigor, while respecting other participants." },
    { title: "Honest Inquiries", desc: "Ask questions that you might hesitate to ask under your public real-world identity." },
    { title: "Thoughtful Contrarianism", desc: "Offer unorthodox or unpopular opinions supported by coherent reasoning." },
    { title: "Constructive Criticism", desc: "Critique software, industry practices, policies, and philosophies analytically." }
  ];

  const prohibited = [
    { title: "Threats & Violent Rhetoric", desc: "Zero tolerance for threats of physical violence, terrorism, or self-harm incitement." },
    { title: "Harassment & Cyberbullying", desc: "Persistent targeted hostility, degradation, slurs, or demeaning attacks." },
    { title: "Doxxing & Privacy Violation", desc: "Sharing real names, private phone numbers, home addresses, or private photos of anyone." },
    { title: "Spam & Automated Scams", desc: "Unsolicited promotional links, crypto pump schemes, or bot spam." }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800/40">
          <ShieldCheck className="w-3.5 h-3.5 text-terracotta-500" />
          <span>Safety & Trust</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Community Guidelines
        </h1>
        <p className="text-sm text-ink-600 dark:text-ink-300 max-w-xl mx-auto font-sans">
          FreeTalk protects anonymity, but anonymity is a privilege built on mutual respect and accountability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Allowed */}
        <div className="p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-serif font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Encouraged on FreeTalk</span>
          </div>

          <div className="space-y-4 pt-2">
            {allowed.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="text-sm font-bold text-ink-900 dark:text-ink-100">{item.title}</h4>
                <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Prohibited */}
        <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-serif font-bold text-base">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>Strictly Prohibited</span>
          </div>

          <div className="space-y-4 pt-2">
            {prohibited.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="text-sm font-bold text-ink-900 dark:text-ink-100">{item.title}</h4>
                <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
