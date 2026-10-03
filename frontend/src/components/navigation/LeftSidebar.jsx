import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Home, 
  Flame, 
  Compass, 
  Bookmark, 
  Bell, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  Settings, 
  ShieldAlert, 
  LayoutDashboard,
  HelpCircle,
  Scale,
  BarChart3
} from 'lucide-react';

export function LeftSidebar({ className = '', onItemClick }) {
  const { isStaff, isAdmin } = useAuth();

  const navItems = [
    { to: '/home', label: 'Home Feed', icon: Home },
    { to: '/explore', label: 'Explore', icon: Flame },
    { to: '/debates', label: 'Blind Debates', icon: Scale },
    { to: '/topics', label: 'Topics', icon: Compass },
    { to: '/insights', label: 'Personal Insights', icon: BarChart3 },
    { to: '/saved', label: 'Saved Discussions', icon: Bookmark },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/messages', label: 'Anonymous Chat', icon: MessageSquare },
    { to: '/activity', label: 'My Activity', icon: User },
    { to: '/privacy-center', label: 'Privacy Center', icon: ShieldCheck, badge: '94%' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminItems = [
    ...(isStaff ? [{ to: '/moderation', label: 'Moderation Queue', icon: ShieldAlert }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between py-6 ${className}`}>
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-paper-400 font-mono">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 dark:bg-terracotta-950/40 dark:text-terracotta-300 dark:border-terracotta-800/60 font-semibold shadow-subtle'
                      : 'text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-olive-50 text-olive-700 border border-olive-200 dark:bg-olive-950/60 dark:text-olive-300 dark:border-olive-800/50">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Staff & Admin Section */}
        {adminItems.length > 0 && (
          <div className="space-y-1 pt-4 border-t border-paper-200 dark:border-ink-800">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
              Safety & Management
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        : 'text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Philosophy Footer Card */}
      <div className="p-4 rounded-xl bg-paper-100 dark:bg-ink-850 border border-paper-200 dark:border-ink-800 text-[11px] space-y-2 shadow-subtle">
        <div className="flex items-center gap-1.5 font-bold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider text-[10px] font-mono">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Core Tenet</span>
        </div>
        <p className="leading-relaxed text-ink-700 dark:text-paper-200 font-serif italic">
          "Your identity is private. Your ideas are public. Your behavior still matters."
        </p>
      </div>
    </aside>
  );
}
