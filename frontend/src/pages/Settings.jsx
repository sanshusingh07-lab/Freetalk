import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authService } from '../services/api.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  Lock, 
  Bell, 
  UserCheck,
  KeyRound
} from 'lucide-react';

export function Settings() {
  const { user, updateSettings } = useAuth();
  const { toast } = useToast();

  const [messagePermission, setMessagePermission] = useState(user?.messagePermission || 'EVERYONE');
  const [personalizedFeed, setPersonalizedFeed] = useState(user?.personalizedFeed !== false);
  const [identityPreference, setIdentityPreference] = useState(user?.identityPreference || 'PERSISTENT');
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await authService.changePassword({
        currentPassword,
        newPassword
      });

      if (res.data.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await updateSettings({
        messagePermission,
        personalizedFeed,
        identityPreference
      });
      toast.success("Settings updated successfully.");
    } catch (err) {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-1">
          Customize your anonymous persona and privacy boundaries.
        </p>
      </div>

      <div className="space-y-6">
        {/* Privacy & Interactions Section */}
        <div className="p-6 rounded-xl bg-surface border border-border space-y-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-olive-600 dark:text-olive-400" />
            <span>Privacy & Direct Messaging</span>
          </h3>

          {/* Message Permissions */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300">
              Who can send you anonymous direct messages?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'EVERYONE', label: 'Everyone' },
                { val: 'RESTRICTED', label: 'Topic Mutuals' },
                { val: 'NOBODY', label: 'Nobody (Disabled)' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setMessagePermission(opt.val)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    messagePermission === opt.val
                      ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/30 text-terracotta-800 dark:text-terracotta-200 font-semibold'
                      : 'border-border bg-surface text-ink-600 dark:text-ink-400 hover:border-ink-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Identity Preference */}
          <div className="space-y-2 pt-3 border-t border-border">
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300">
              Default Posting Persona Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIdentityPreference('PERSISTENT')}
                className={`p-3 rounded-lg border text-xs text-left transition-all ${
                  identityPreference === 'PERSISTENT'
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/30 text-ink-900 dark:text-ink-100 font-semibold'
                    : 'border-border bg-surface text-ink-600 dark:text-ink-400 hover:border-ink-400'
                }`}
              >
                <div className="font-bold text-ink-900 dark:text-ink-100 mb-0.5">Persistent Anonymous Alias</div>
                <div className="text-[11px] text-ink-500">Same generated identity across discussions.</div>
              </button>

              <button
                type="button"
                onClick={() => setIdentityPreference('TEMPORARY')}
                className={`p-3 rounded-lg border text-xs text-left transition-all ${
                  identityPreference === 'TEMPORARY'
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/30 text-ink-900 dark:text-ink-100 font-semibold'
                    : 'border-border bg-surface text-ink-600 dark:text-ink-400 hover:border-ink-400'
                }`}
              >
                <div className="font-bold text-ink-900 dark:text-ink-100 mb-0.5">Disappearing Temporary Alias</div>
                <div className="text-[11px] text-ink-500">Fresh anonymous identities for each thread.</div>
              </button>
            </div>
          </div>

          {/* Personalization Toggle */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-ink-800 dark:text-ink-200">Personalized Feed Recommendations</div>
              <div className="text-[11px] text-ink-500">Sort home stream by your followed topics and interests.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={personalizedFeed}
                onChange={(e) => setPersonalizedFeed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-paper-300 dark:bg-charcoal-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta-600"></div>
            </label>
          </div>
        </div>

        {/* Account Security & Password Section */}
        <div className="p-6 rounded-xl bg-surface border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-olive-600 dark:text-olive-400" />
              <span>Account Security & Password</span>
            </h3>
            <span className="text-[10px] font-mono text-olive-700 dark:text-olive-300 bg-olive-50 dark:bg-olive-950/60 border border-olive-200 dark:border-olive-800/40 px-2 py-0.5 rounded-md">
              Argon2id Encrypted
            </span>
          </div>

          <p className="text-xs text-ink-500">
            Change your account password. Strong passwords protect your private discussion session and identities.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
            <Input
              label="Current Password"
              type="password"
              icon={Lock}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="New Password (min 8 chars)"
                type="password"
                icon={Lock}
                placeholder="New strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                icon={Lock}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={KeyRound}
                isLoading={isChangingPassword}
              >
                Change Password
              </Button>
            </div>
          </form>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveSettings}
            isLoading={isSaving}
          >
            Save All Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
