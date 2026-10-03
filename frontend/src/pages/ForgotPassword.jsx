import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

export function ForgotPassword() {
  const { isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      await authService.forgotPassword({ email });
      setSubmitted(true);
      toast.success("Instructions dispatched if account exists.");
    } catch (err) {
      toast.error("Failed to process request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-paper-200 dark:border-ink-800 p-8 sm:p-9 bg-white dark:bg-charcoal-850 shadow-card space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200 dark:border-terracotta-500/30 text-terracotta-600 dark:text-terracotta-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 font-sans">
            Enter your private email address to receive password recovery steps.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs text-center space-y-3">
            <p>If an account matches this email, instructions have been dispatched.</p>
            <Link to="/login" className="inline-block text-xs font-semibold text-terracotta-600 dark:text-terracotta-400 underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Email"
              type="email"
              icon={Mail}
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isLoading}>
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
