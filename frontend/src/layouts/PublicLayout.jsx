import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, ArrowRight } from 'lucide-react';

export function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-paper-50 text-black selection:bg-terracotta-500 selection:text-white font-sans antialiased">
      {/* Public Header */}
      <header className="w-full border-b border-paper-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-3 group">
            <img
              src="/freetalk-icon.jpg"
              alt="FreeTalk"
              className="w-9 h-9 rounded-lg object-contain border border-paper-200 shadow-subtle group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg tracking-tight text-black">
                FreeTalk
              </span>
              <span className="text-[10px] text-black tracking-wider uppercase font-semibold">
                Ideas Over Identity
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-black">
            <Link to="/explore" className="hover:text-terracotta-600 transition-colors">Explore</Link>
            <Link to="/debates" className="hover:text-terracotta-600 transition-colors">Blind Debates</Link>
            <Link to="/about" className="hover:text-terracotta-600 transition-colors">About</Link>
            <Link to="/guidelines" className="hover:text-terracotta-600 transition-colors">Guidelines</Link>
            <Link to="/privacy" className="hover:text-terracotta-600 transition-colors">Privacy</Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/home"
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-1.5"
              >
                <span>Go to Discussions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-2 text-black hover:text-terracotta-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Talking
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-paper-200 bg-paper-100/80 py-12 text-xs text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 font-serif font-bold text-black text-sm">
              <Shield className="w-4 h-4 text-terracotta-600" />
              <span>FreeTalk Discussion Platform</span>
            </div>
            <p className="text-black text-[11px] italic font-medium">
              "Say what you think. Not who you are."
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-black">
            <Link to="/about" className="hover:text-terracotta-600 transition-colors">About</Link>
            <Link to="/guidelines" className="hover:text-terracotta-600 transition-colors">Community Guidelines</Link>
            <Link to="/privacy" className="hover:text-terracotta-600 transition-colors">Privacy Policy</Link>
            <Link to="/explore" className="hover:text-terracotta-600 transition-colors">Explore</Link>
            <a href="mailto:safety@freetalk.internal" className="hover:text-terracotta-600 transition-colors">Report a Problem</a>
          </div>

          <div className="text-[11px] text-black font-medium">
            © {new Date().getFullYear()} FreeTalk. Privacy & Intellectual Rigor.
          </div>
        </div>
      </footer>
    </div>
  );
}
