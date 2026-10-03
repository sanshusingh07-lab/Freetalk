import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { userService } from '../../services/api.js';
import { Avatar } from '../identity/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { RandomDiscussionModal } from '../dialogs/RandomDiscussionModal.jsx';
import { 
  Search, 
  Bell, 
  Plus, 
  ShieldCheck, 
  LogOut,
  SlidersHorizontal,
  Menu,
  X,
  Ghost,
  Dices,
  BarChart3,
  EyeOff
} from 'lucide-react';

export function Navbar({ onOpenMobileMenu }) {
  const { user, activeIdentity, isAuthenticated, logout } = useAuth();
  const { unreadNotifications } = useSocket();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [isGhostActive, setIsGhostActive] = useState(user?.isGhostMode || false);
  const [isTogglingGhost, setIsTogglingGhost] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleToggleGhostMode = async () => {
    try {
      setIsTogglingGhost(true);
      const res = await userService.toggleGhostMode();
      if (res.data.success) {
        setIsGhostActive(res.data.isGhostMode);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle Ghost Mode.");
    } finally {
      setIsTogglingGhost(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-paper-200 dark:border-ink-800 bg-white/90 dark:bg-ink-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Mobile menu toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-ink-500 dark:text-paper-400 hover:text-ink-900 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-3 group">
            <img
              src="/freetalk-icon.jpg"
              alt="FreeTalk"
              className="w-8 h-8 rounded-md object-contain border border-paper-200 dark:border-ink-700 shadow-subtle group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg tracking-tight text-ink-900 dark:text-paper-100 flex items-center gap-1.5">
                FreeTalk
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-paper-200 dark:bg-ink-800 text-ink-600 dark:text-paper-300 font-sans font-semibold">
                  Anon
                </span>
              </span>
              <span className="hidden sm:block text-[10px] text-ink-500 dark:text-paper-400 tracking-wider uppercase font-medium">
                Ideas Over Identity
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-paper-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions, topics, hashtags..."
              className="w-full bg-paper-100/90 dark:bg-ink-800/80 border border-paper-200 dark:border-ink-700 rounded-lg pl-10 pr-4 py-2 text-xs text-ink-900 dark:text-paper-100 placeholder-ink-400 dark:placeholder-paper-400 focus:outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
            />
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Feature 14: Random Discussion Roulette */}
          <button
            onClick={() => setIsRandomModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-700 dark:text-paper-200 hover:text-ink-900 dark:hover:text-white bg-paper-100 dark:bg-ink-800/70 hover:bg-paper-200/80 dark:hover:bg-ink-700 border border-paper-200 dark:border-ink-700 transition-all"
            title="Start Random Conversation Roulette"
          >
            <Dices className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
            <span className="hidden sm:inline">Random</span>
          </button>

          {/* Feature 15: Ghost Mode Toggle Button */}
          {isAuthenticated && (
            <button
              onClick={handleToggleGhostMode}
              disabled={isTogglingGhost}
              className={`p-2 rounded-lg transition-all border ${
                isGhostActive
                  ? 'bg-olive-100 text-olive-800 border-olive-300 dark:bg-olive-950/60 dark:text-olive-300 dark:border-olive-700 shadow-sm'
                  : 'text-ink-500 dark:text-paper-400 hover:text-ink-800 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800 border-transparent'
              }`}
              title={isGhostActive ? "Ghost Mode Active: Invisible browsing" : "Ghost Mode Off: Click to hide activity"}
            >
              {isGhostActive ? <EyeOff className="w-4 h-4 animate-pulse" /> : <Ghost className="w-4 h-4" />}
            </button>
          )}

          {isAuthenticated ? (
            <>
              {/* Create Discussion CTA */}
              <Link to="/create" className="hidden sm:block">
                <Button variant="primary" size="sm" icon={Plus}>
                  New Thought
                </Button>
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg text-ink-500 dark:text-paper-400 hover:text-ink-800 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-terracotta-600 ring-2 ring-white dark:ring-ink-900 animate-pulse" />
                )}
              </Link>

              {/* Anonymous Identity Avatar & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-paper-100 dark:hover:bg-ink-800 border border-paper-200 dark:border-ink-700 transition-colors"
                >
                  <span className="hidden lg:block text-xs font-semibold text-ink-800 dark:text-paper-100">
                    {activeIdentity?.displayName || "Anonymous Fox"}
                  </span>
                  <Avatar
                    seed={activeIdentity?.avatarSeed || 'anon'}
                    shape={activeIdentity?.avatarShape || 'geometric'}
                    color={activeIdentity?.avatarColor || '#C45A3C'}
                    size="sm"
                  />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-paper-200 dark:border-ink-700 bg-white dark:bg-ink-850 shadow-elevated p-2 z-50 text-xs space-y-1"
                    onMouseLeave={() => setIsProfileDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-paper-100 dark:border-ink-800">
                      <div className="font-serif font-bold text-ink-900 dark:text-paper-100">{activeIdentity?.displayName}</div>
                      <div className="text-[11px] text-terracotta-600 dark:text-terracotta-400 font-mono mt-0.5">{user?.contributionBadge}</div>
                    </div>

                    <Link
                      to="/insights"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-ink-700 dark:text-paper-200 hover:text-ink-900 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
                      <span>Personal Insights</span>
                    </Link>

                    <Link
                      to="/activity"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-ink-700 dark:text-paper-200 hover:text-ink-900 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
                    >
                      <span>My Anonymous Activity</span>
                    </Link>

                    <Link
                      to="/privacy-center"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-ink-700 dark:text-paper-200 hover:text-ink-900 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-olive-600 dark:text-olive-400" />
                      <span>Privacy Center</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-ink-700 dark:text-paper-200 hover:text-ink-900 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-ink-400 dark:text-paper-400" />
                      <span>Settings</span>
                    </Link>

                    <div className="border-t border-paper-100 dark:border-ink-800 my-1 pt-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Start Talking</Button>
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Feature 14: Random Conversation Roulette Modal */}
      <RandomDiscussionModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
      />
    </header>
  );
}
