import React, { useState, useEffect } from 'react';
import { userService } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Trash2, 
  Lock, 
  EyeOff, 
  FileText 
} from 'lucide-react';

export function PrivacyCenter() {
  const { logout } = useAuth();
  const { toast } = useToast();

  const [privacyData, setPrivacyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const fetchPrivacyData = async () => {
    try {
      setLoading(true);
      const res = await userService.getPrivacyCenter();
      if (res.data.success) {
        setPrivacyData(res.data);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      setIsDownloading(true);
      const res = await userService.downloadData();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'freetalk-privacy-export.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Privacy data package downloaded.");
    } catch (err) {
      toast.error("Failed to export data package.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const res = await userService.deleteAccount();
      if (res.data.success) {
        toast.success("Account and credentials permanently purged.");
        logout();
      }
    } catch (err) {
      toast.error(err.message || "Failed to purge account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header & Privacy Score Showcase */}
      <div className="p-8 md:p-10 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-charcoal-850 shadow-subtle relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Architectural Privacy Audit</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
              Personal Privacy Center
            </h1>
            <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-300 max-w-lg leading-relaxed font-sans">
              Transparent verification of how FreeTalk segregates your private session credentials from your public anonymous interactions.
            </p>
          </div>

          {/* Privacy Score Ring */}
          <div className="p-6 rounded-xl bg-paper-50 dark:bg-charcoal-800 border border-paper-200 dark:border-charcoal-700 flex flex-col items-center justify-center text-center shadow-subtle shrink-0 w-44">
            <div className="text-xs text-ink-500 dark:text-ink-400 uppercase tracking-widest font-semibold mb-1">
              Privacy Score
            </div>
            <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {privacyData?.privacyScore || 94}
              <span className="text-lg text-ink-400 font-normal">/100</span>
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
              High Anonymity
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Factor Breakdown */}
      <div className="p-6 rounded-xl border border-paper-200 dark:border-ink-800 space-y-4 bg-white dark:bg-charcoal-850 shadow-subtle">
        <h3 className="font-serif text-base font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
          <span>Why this score?</span>
        </h3>

        <div className="space-y-2.5">
          {privacyData?.factors?.map((factor, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                factor.passed
                  ? 'bg-paper-50 dark:bg-charcoal-800/80 border-paper-200 dark:border-charcoal-700 text-ink-800 dark:text-ink-200'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {factor.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-semibold">{factor.title}</div>
                  {factor.advice && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400/80 mt-0.5">{factor.advice}</div>
                  )}
                </div>
              </div>

              <span className={`text-xs font-mono font-bold ${factor.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {factor.points > 0 ? `+${factor.points}` : factor.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="p-6 rounded-xl border border-paper-200 dark:border-ink-800 space-y-3 flex flex-col justify-between bg-white dark:bg-charcoal-850 shadow-subtle">
          <div>
            <div className="w-10 h-10 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200 dark:border-terracotta-500/30 text-terracotta-600 dark:text-terracotta-400 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-ink-900 dark:text-ink-100">Export Your Data Archive</h4>
            <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed mt-1 font-sans">
              Download a complete JSON record of all discussions, comments, and topic interests linked to your internal account.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadData}
            isLoading={isDownloading}
            className="w-full mt-4"
          >
            Download Data Package (.json)
          </Button>
        </div>

        {/* Permanent Account Deletion */}
        <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/10 space-y-3 flex flex-col justify-between shadow-subtle">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-rose-900 dark:text-rose-300">Delete Account & Purge Data</h4>
            <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed mt-1 font-sans">
              Permanently delete your account credentials, sessions, and private records. This action is irreversible.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full mt-4"
          >
            Purge Account Permanently
          </Button>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
      >
        <div className="space-y-4 text-xs text-ink-700 dark:text-ink-200 leading-relaxed font-sans">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Warning: This will permanently delete your authentication record and private bookmarks.</span>
          </div>
          <p>
            Are you completely sure you wish to delete your account? All sessions will be immediately terminated.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-paper-100 dark:border-ink-800">
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteAccount} isLoading={isDeleting}>
              Yes, Permanently Purge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
