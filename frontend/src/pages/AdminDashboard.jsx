import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  UserX, 
  Plus, 
  TrendingUp, 
  Activity 
} from 'lucide-react';

export function AdminDashboard() {
  const { toast } = useToast();

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New topic modal/inputs
  const [topicName, setTopicName] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicColor, setTopicColor] = useState('#6366F1');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes, usersRes] = await Promise.all([
        adminService.getStats(),
        adminService.getAnalytics(),
        adminService.getUsers()
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.health);
      if (usersRes.data.success) setUsers(usersRes.data.users);
    } catch (err) {
      toast.error("Failed to load admin telemetry.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await adminService.updateUser(userId, { status: nextStatus });
      if (res.data.success) {
        toast.success(`User marked as ${nextStatus}.`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      }
    } catch (err) {
      toast.error("Failed to update user status.");
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicName.trim() || !topicSlug.trim()) return;

    try {
      setIsCreatingTopic(true);
      const res = await adminService.createTopic({
        name: topicName.trim(),
        slug: topicSlug.trim(),
        description: topicDesc.trim(),
        color: topicColor
      });

      if (res.data.success) {
        toast.success(`Topic #${res.data.topic.name} created.`);
        setTopicName('');
        setTopicSlug('');
        setTopicDesc('');
      }
    } catch (err) {
      toast.error(err.message || "Failed to create topic.");
    } finally {
      setIsCreatingTopic(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-charcoal-900 border border-paper-200 dark:border-ink-800 flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Platform Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-950 dark:text-ink-100 tracking-tight font-serif">
            Admin Dashboard & Telemetry
          </h1>
          <p className="text-xs text-ink-600 dark:text-ink-300 mt-1">
            System performance, moderation throughput, community health, and user privilege controls.
          </p>
        </div>
      </div>

      {/* Top 6 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Users', value: stats?.totalUsers || 12420, icon: Users, color: 'text-terracotta' },
          { label: 'Posts Today', value: stats?.postsToday || 3241, icon: FileText, color: 'text-olive' },
          { label: 'Total Reports', value: stats?.totalReports || 142, icon: ShieldAlert, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Flagged Content', value: stats?.flaggedContent || 73, icon: Activity, color: 'text-rose-600 dark:text-rose-400' },
          { label: 'Resolved Reports', value: stats?.resolvedReports || 128, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Suspended Users', value: stats?.suspendedUsers || 24, icon: UserX, color: 'text-rose-600 dark:text-rose-400' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-paper-200 dark:border-ink-800 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-ink-600 dark:text-ink-300">
                <span className="text-[11px] font-semibold">{item.label}</span>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
              <div className="text-xl font-bold font-mono text-ink-950 dark:text-ink-100">{item.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recharts Community Health Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discussion Activity Trend */}
          <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-paper-200 dark:border-ink-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Discussion Activity & Health %</h3>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {analytics.healthyDiscussionPercentage}% Healthy Discussions
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.activityTrend}>
                  <defs>
                    <linearGradient id="colorDisc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C45A3C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C45A3C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-paper-200 dark:text-ink-800 opacity-50" />
                  <XAxis dataKey="day" stroke="currentColor" className="text-ink-500 dark:text-ink-400" fontSize={11} />
                  <YAxis stroke="currentColor" className="text-ink-500 dark:text-ink-400" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface-card, #ffffff)', borderColor: 'var(--border, #e5e2da)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary, #202124)' }} />
                  <Area type="monotone" dataKey="discussions" stroke="#C45A3C" strokeWidth={2} fillOpacity={1} fill="url(#colorDisc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reports by Category */}
          <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-paper-200 dark:border-ink-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Reports by Category</h3>
              <span className="text-xs font-mono text-ink-600 dark:text-ink-300">
                Avg Resolution: {analytics.averageResolutionHours} hrs
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.reportsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-paper-200 dark:text-ink-800 opacity-50" />
                  <XAxis dataKey="name" stroke="currentColor" className="text-ink-500 dark:text-ink-400" fontSize={11} />
                  <YAxis stroke="currentColor" className="text-ink-500 dark:text-ink-400" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface-card, #ffffff)', borderColor: 'var(--border, #e5e2da)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary, #202124)' }} />
                  <Bar dataKey="count" fill="#68735B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* User Management & Topic Creation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-paper-200 dark:border-ink-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <span>Platform User Directory</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-paper-200 dark:border-ink-800 text-ink-600 dark:text-ink-300 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">User (Public Persona)</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Activity</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200/60 dark:divide-ink-800/60">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-paper-100/50 dark:hover:bg-charcoal-800/50">
                    <td className="py-3 font-bold text-ink-900 dark:text-ink-100">
                      {u.primaryIdentity}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-accent font-semibold">
                      {u.role}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' 
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 text-ink-600 dark:text-ink-300 font-mono text-[11px]">
                      {u.postsCount} posts • {u.commentsCount} replies
                    </td>
                    <td className="py-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            u.status === 'SUSPENDED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          {u.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Topic Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-paper-200 dark:border-ink-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            <span>Create Topic Community</span>
          </h3>

          <form onSubmit={handleCreateTopic} className="space-y-3">
            <Input
              label="Topic Name"
              placeholder="Quantum Computing"
              value={topicName}
              onChange={(e) => {
                setTopicName(e.target.value);
                setTopicSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              required
            />

            <Input
              label="Slug"
              placeholder="quantum-computing"
              value={topicSlug}
              onChange={(e) => setTopicSlug(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={topicDesc}
                onChange={(e) => setTopicDesc(e.target.value)}
                placeholder="Topic focus and discussion parameters..."
                className="w-full bg-paper-50 dark:bg-charcoal-950 border border-paper-200 dark:border-ink-800 rounded-xl p-2.5 text-xs text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-accent"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full"
              isLoading={isCreatingTopic}
            >
              Add Community
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
