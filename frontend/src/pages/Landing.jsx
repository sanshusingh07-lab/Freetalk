import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { 
  ShieldCheck, 
  MessageSquare, 
  Scale, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  EyeOff, 
  Flame, 
  FileCheck, 
  Compass, 
  Zap, 
  Ghost,
  HelpCircle,
  Brain,
  Quote
} from 'lucide-react';

export function Landing() {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="relative space-y-24 py-10 md:py-16 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-4">
        {/* Brand Icon Artwork Centerpiece */}
        <div className="flex justify-center mb-8">
          <div className="relative p-2 rounded-2xl bg-white border border-paper-200 shadow-card group transition-transform hover:scale-105">
            <img
              src="/freetalk-icon.jpg"
              alt="FreeTalk: Ideas Over Identity"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-contain"
            />
          </div>
        </div>

        {/* Editorial Sub-badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium bg-paper-100 border border-paper-200 text-black mb-6 shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse" />
          <span>Ideas Over Identity</span>
          <span className="text-paper-400">•</span>
          <span>A privacy-first discussion network</span>
        </div>

        {/* Human-Crafted Editorial Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black max-w-4xl mx-auto leading-[1.08] mb-6">
          Say what you think. <br />
          <span className="text-terracotta-600 italic">
            Not who you are.
          </span>
        </h1>

        {/* Editorial Subtitle */}
        <p className="text-base sm:text-lg text-black max-w-2xl mx-auto leading-relaxed mb-10 font-sans font-normal">
          FreeTalk is a thoughtfully engineered space where discussions are evaluated on argument clarity and evidence—never on follower counts, algorithmic clout, or personal vanity.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" icon={ArrowRight} className="w-full sm:w-auto font-semibold">
              Start Talking Anonymously
            </Button>
          </Link>
          <Link to="/debates" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" icon={Scale} className="w-full sm:w-auto font-semibold text-black">
              Explore Blind Debates
            </Button>
          </Link>
        </div>

        {/* Editorial Blind Debate Preview Card */}
        <div className="mt-14 relative max-w-3xl mx-auto rounded-xl border border-paper-200 p-6 md:p-8 bg-white shadow-card text-left">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-paper-100">
            <div className="flex items-center gap-2 text-xs font-bold text-terracotta-700 uppercase tracking-wider font-mono">
              <Scale className="w-4 h-4" />
              <span>Blind Debate Arena • Live Preview</span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-olive-800 bg-olive-50 border border-olive-200 px-2.5 py-0.5 rounded-full">
              Argument-Based Voting
            </span>
          </div>

          <h3 className="font-serif text-lg md:text-xl font-bold text-black mb-4 leading-snug">
            “Will autonomous AI coding agents diminish traditional software engineering roles?”
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Side A: Terracotta */}
            <div className="p-4 rounded-lg bg-terracotta-50/60 border border-terracotta-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-terracotta-800 font-mono">
                <span>🅰️ Anonymous Raven</span>
                <span>58% support</span>
              </div>
              <p className="text-xs text-black leading-relaxed font-sans font-normal">
                “Abstraction increases, but architectural tradeoffs, concurrency, and security boundaries remain fundamentally human.”
              </p>
            </div>

            {/* Side B: Olive */}
            <div className="p-4 rounded-lg bg-olive-50/60 border border-olive-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-olive-800 font-mono">
                <span>🅱️ Anonymous Fox</span>
                <span>42% support</span>
              </div>
              <p className="text-xs text-black leading-relaxed font-sans font-normal">
                “Traditional syntax-heavy roles will collapse. The future belongs to prompt orchestration and domain system designers.”
              </p>
            </div>
          </div>

          {/* Voting Support Bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-paper-200 overflow-hidden flex">
              <div className="bg-terracotta-600 transition-all duration-700" style={{ width: '58%' }} />
              <div className="bg-olive-600 transition-all duration-700" style={{ width: '42%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-black font-mono font-medium">
              <span>Argument A (Raven): 58%</span>
              <span>Argument B (Fox): 42%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL METRICS RIBBON */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-xl border border-paper-200 bg-white shadow-subtle">
          <div className="text-center p-3">
            <div className="text-2xl sm:text-3xl font-bold text-black font-mono">100%</div>
            <div className="text-xs text-black font-medium mt-1">Identity Shielded</div>
          </div>
          <div className="text-center p-3 border-l border-paper-100">
            <div className="text-2xl sm:text-3xl font-bold text-olive-700 font-mono">&lt;0.01s</div>
            <div className="text-xs text-black font-medium mt-1">AI Moderation Latency</div>
          </div>
          <div className="text-center p-3 border-t md:border-t-0 md:border-l border-paper-100">
            <div className="text-2xl sm:text-3xl font-bold text-terracotta-600 font-mono">15</div>
            <div className="text-xs text-black font-medium mt-1">Core Innovations</div>
          </div>
          <div className="text-center p-3 border-t md:border-t-0 border-l border-paper-100">
            <div className="text-2xl sm:text-3xl font-bold text-black font-mono">0</div>
            <div className="text-xs text-black font-medium mt-1">Follower Vanity Metrics</div>
          </div>
        </div>
      </section>

      {/* 3. EDITORIAL PILLARS & INNOVATIONS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-terracotta-600">
            Architecture & Philosophy
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-black mt-2 tracking-tight">
            Designed for Intellectual Honesty
          </h2>
          <p className="text-sm text-black mt-2 max-w-xl mx-auto leading-relaxed font-normal">
            Every feature in FreeTalk replaces performative posturing with constructive discourse.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Blind Debate Arena */}
          <div className="md:col-span-2 p-6 rounded-xl border border-paper-200 bg-white shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-terracotta-600 uppercase">
                <Scale className="w-4 h-4" />
                <span>Innovation #1</span>
              </div>
              <span className="text-xs font-semibold text-black">Blind Debate Arena</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-black">
              Blind Debate Arena
            </h3>
            <p className="text-xs sm:text-sm text-black leading-relaxed font-normal">
              Users argue opposite perspectives under randomized pseudonyms (🅰️ Anonymous Raven vs 🅱️ Anonymous Fox). The community casts votes strictly on argument logic and empirical evidence—never on follower count or authority.
            </p>
            <div className="pt-2">
              <Link to="/debates" className="text-xs font-bold text-terracotta-600 hover:underline flex items-center gap-1">
                <span>Explore the debate arena</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Card 2: AI Safety Sentinel */}
          <div className="p-6 rounded-xl border border-paper-200 bg-white shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-olive-700 uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Instant Safety</span>
              </div>
              <span className="text-[10px] font-mono text-olive-700 bg-olive-50 px-2 py-0.5 rounded border border-olive-200 font-semibold">
                0.008s
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold text-black">
              Instant AI Moderation
            </h3>
            <p className="text-xs sm:text-sm text-black leading-relaxed font-normal">
              In-built multi-tier AI removes slur attacks, harassment, and financial scams in milliseconds while preserving rigorous, heated discussion.
            </p>
          </div>

          {/* Card 3: Challenge My Opinion */}
          <div className="p-6 rounded-xl border border-paper-200 bg-white shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-700 uppercase">
              <MessageSquare className="w-4 h-4" />
              <span>Innovation #2</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-black">
              “Challenge My Opinion”
            </h3>
            <p className="text-xs sm:text-sm text-black leading-relaxed font-normal">
              Post an opinion and invite contrary arguments. Replies are structured into Agree, Disagree, Evidence, and Alternative views.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-olive-50 text-olive-800 border border-olive-200 font-medium">🟢 Agree</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-terracotta-50 text-terracotta-800 border border-terracotta-200 font-medium">🔴 Disagree</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-paper-100 text-black border border-paper-200 font-medium">🔬 Evidence</span>
            </div>
          </div>

          {/* Card 4: Fact vs Opinion Labels */}
          <div className="p-6 rounded-xl border border-paper-200 bg-white shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-black uppercase">
              <FileCheck className="w-4 h-4 text-terracotta-600" />
              <span>Innovation #3 & #4</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-black">
              Fact vs. Opinion Badges
            </h3>
            <p className="text-xs sm:text-sm text-black leading-relaxed font-normal">
              Declarative classification: label statements as Opinion, Fact, Question, Idea, or Information with source citations attached.
            </p>
          </div>

          {/* Card 5: What Changed My Mind? */}
          <div className="p-6 rounded-xl border border-paper-200 bg-white shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-terracotta-600 uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Innovation #12</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-black">
              “What Changed My Mind?”
            </h3>
            <p className="text-xs sm:text-sm text-black leading-relaxed font-normal">
              An intellectual honesty metric tracking whether discussion altered opinions, celebrating persuasion over dogmatism.
            </p>
          </div>

          {/* Card 6: Zero Identity Footprint & Stealth Ghost Mode */}
          <div className="md:col-span-3 p-6 sm:p-8 rounded-xl border border-paper-200 bg-paper-100/70 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-olive-800 uppercase">
                <Ghost className="w-4 h-4 text-olive-600" />
                <span>Innovation #15 • Privacy First</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-black">
                Zero Identity Footprint & Stealth Ghost Mode
              </h3>
              <p className="text-xs sm:text-sm text-black leading-relaxed font-sans font-normal">
                No real names, no phone numbers, no profile pictures, and zero follower counts. Browse with full invisibility whenever you want your thoughts to remain completely private.
              </p>
            </div>
            <Link to="/register">
              <Button variant="primary" size="md" className="font-semibold">
                Create Anonymous Persona
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. REAL CONVERSATIONS PREVIEW */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 md:p-12 rounded-2xl border border-paper-200 bg-white shadow-card">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-terracotta-600 uppercase mb-3">
              <Brain className="w-4 h-4" />
              <span>Real-Time Anonymity</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-black mb-4">
              Discussions evaluated on logic, not clout.
            </h2>
            <p className="text-xs sm:text-sm text-black leading-relaxed mb-6 font-normal">
              Every participant receives an anonymous cryptographic identity. Disagree with high-status figures without risk. Agree with unconventional thinkers without hesitation.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/explore">
                <Button variant="primary" size="sm" icon={Compass} className="font-semibold">
                  Browse Community Feed
                </Button>
              </Link>
              <Link to="/guidelines">
                <Button variant="outline" size="sm" icon={HelpCircle} className="font-semibold text-black">
                  Read Community Standards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
