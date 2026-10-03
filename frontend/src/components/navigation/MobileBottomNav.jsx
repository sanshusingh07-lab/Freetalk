import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Flame, Plus, Bell, Menu } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

export function MobileBottomNav({ onOpenMenu }) {
  const { unreadNotifications } = useSocket();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-paper-200 dark:border-ink-800 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md px-4 py-2">
      <div className="flex items-center justify-around">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1 text-[10px] transition-colors ${
              isActive ? 'text-terracotta-600 dark:text-terracotta-400 font-semibold' : 'text-ink-400 dark:text-paper-400 hover:text-ink-700'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1 text-[10px] transition-colors ${
              isActive ? 'text-terracotta-600 dark:text-terracotta-400 font-semibold' : 'text-ink-400 dark:text-paper-400 hover:text-ink-700'
            }`
          }
        >
          <Flame className="w-5 h-5" />
          <span>Explore</span>
        </NavLink>

        {/* Elevated Create CTA */}
        <Link
          to="/create"
          className="relative -top-4 p-3 rounded-xl bg-terracotta-600 text-white shadow-card border-2 border-white dark:border-ink-900 hover:scale-105 active:scale-95 transition-transform"
          title="Create Discussion"
        >
          <Plus className="w-5 h-5" />
        </Link>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 p-1 text-[10px] transition-colors ${
              isActive ? 'text-terracotta-600 dark:text-terracotta-400 font-semibold' : 'text-ink-400 dark:text-paper-400 hover:text-ink-700'
            }`
          }
        >
          <Bell className="w-5 h-5" />
          <span>Alerts</span>
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-terracotta-600 ring-2 ring-white dark:ring-ink-900" />
          )}
        </NavLink>

        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center gap-1 p-1 text-[10px] text-ink-400 dark:text-paper-400 hover:text-ink-700"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
