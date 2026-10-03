import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  Heart, 
  ShieldAlert, 
  Vote, 
  Mail,
  Scale 
} from 'lucide-react';

export function Notifications() {
  const { setUnreadNotifications } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadNotifications(res.data.unreadCount || 0);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAsRead('all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
    } catch (err) {
      // silent
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'REPLY': return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'REACTION': return <Heart className="w-4 h-4 text-rose-400" />;
      case 'POLL_RESULT': return <Vote className="w-4 h-4 text-cyan-400" />;
      case 'MESSAGE': return <Mail className="w-4 h-4 text-amber-400" />;
      case 'MODERATION': return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'APPEAL': return <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default: return <Bell className="w-4 h-4 text-ink-500 dark:text-ink-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600 dark:text-terracotta-400 mb-1">
            <Bell className="w-4 h-4 text-terracotta-500" />
            <span>Activity Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-ink-100 tracking-tight">
            Notifications
          </h1>
          <p className="text-xs text-ink-600 dark:text-ink-300 mt-1">
            Private updates regarding your anonymous interactions and moderation reviews.
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-paper-100 dark:bg-charcoal-800 hover:bg-paper-200 dark:hover:bg-charcoal-700 text-ink-800 dark:text-ink-200 border border-border transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-ink-600 dark:text-ink-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="You have no notifications yet. Start or join discussions to connect anonymously."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                n.isRead
                  ? 'bg-surface border-border text-ink-700 dark:text-ink-300'
                  : 'bg-terracotta-50/50 dark:bg-terracotta-900/10 border-terracotta-500/40 text-ink-900 dark:text-ink-100 shadow-sm'
              }`}
            >
              <div className="p-2 rounded-lg bg-paper-100 dark:bg-charcoal-800 border border-border shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-ink-900 dark:text-ink-100">{n.title}</h4>
                  <span className="text-[10px] text-ink-500 dark:text-ink-400 font-mono">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-ink-600 dark:text-ink-300 mt-0.5 leading-relaxed">{n.content}</p>
                {n.link && (
                  <Link
                    to={n.link}
                    className="inline-block mt-2 text-[11px] text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold"
                  >
                    View details &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
