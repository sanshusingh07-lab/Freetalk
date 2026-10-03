import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';

export function Login() {
  const { sendOtp, verifyOtp, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState('CREDENTIALS'); // 'CREDENTIALS' | 'OTP'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpInputRef = useRef(null);

  // Timer countdown for resending OTP
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Focus OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'OTP' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  if (!loading && isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Step 1: Submit credentials to receive OTP (or direct login for admin)
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      const res = await sendOtp({ email, password, purpose: 'LOGIN' });

      if (res.success) {
        if (res.otpRequired === false) {
          // Admin / staff bypass: logged in directly
          toast.success(`Welcome back, ${res.user?.activeIdentity?.displayName || 'Admin'}!`);
          navigate('/home', { replace: true });
        } else {
          // Regular user: proceed to OTP verification
          setStep('OTP');
          setOtpCode(''); // Keep field clean for user manual entry
          setResendCountdown(60);
          toast.success(res.message || 'Verification code sent to your email! (Check your Inbox & Spam folder)');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify the 6-digit OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await verifyOtp({
        email,
        code: cleanCode,
        purpose: 'LOGIN'
      });

      if (res.success) {
        toast.success(`Welcome back, ${res.user?.activeIdentity?.displayName || 'friend'}!`);
        navigate('/home', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending) return;

    try {
      setIsResending(true);
      const res = await sendOtp({ email, password, purpose: 'LOGIN' });
      if (res.success) {
        setResendCountdown(60);
        toast.success('A new verification code has been dispatched to your email.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md rounded-xl border border-paper-200 dark:border-ink-800 p-8 sm:p-9 bg-white dark:bg-ink-850 shadow-card space-y-6">
        {step === 'CREDENTIALS' ? (
          <>
            <div className="text-center space-y-1.5">
              <img
                src="/freetalk-icon.jpg"
                alt="FreeTalk"
                className="w-12 h-12 rounded-xl object-contain border border-paper-200 dark:border-ink-700 shadow-subtle mx-auto mb-3"
              />
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-paper-100 tracking-tight">
                Sign In to FreeTalk
              </h1>
              <p className="text-xs text-ink-500 dark:text-paper-400 font-sans">
                Enter your credentials to receive your secure login verification code.
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4 pt-1">
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="e.g. alex.morgan92@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-ink-600 dark:text-paper-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-paper-300 text-terracotta-600 focus:ring-terracotta-500"
                  />
                  <span>Remember this session</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoading}
                  icon={ArrowRight}
                >
                  Continue with Email OTP
                </Button>
              </div>
            </form>

            {/* Security Privacy Assurance */}
            <div className="pt-4 border-t border-paper-100 dark:border-ink-800 flex items-center justify-center gap-1.5 text-[11px] text-olive-700 dark:text-olive-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Two-Factor Email Verification • Encrypted Auth</span>
            </div>

            <div className="text-center text-xs text-ink-500 dark:text-paper-400">
              Don't have an anonymous persona yet?{' '}
              <Link
                to="/register"
                className="text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold transition-colors"
              >
                Start Talking
              </Link>
            </div>
          </>
        ) : (
          /* STEP 2: OTP Verification */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-600 dark:text-terracotta-400 border border-terracotta-200 dark:border-terracotta-800/60 flex items-center justify-center mx-auto shadow-subtle">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink-900 dark:text-paper-100">
                Check Your Gmail
              </h2>
              <p className="text-xs text-ink-500 dark:text-paper-400 max-w-xs mx-auto">
                We've sent a 6-digit security code to{' '}
                <span className="font-semibold text-ink-800 dark:text-paper-200">{email}</span>.
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 font-medium flex items-center justify-center gap-2 max-w-sm mx-auto shadow-subtle">
                <span className="text-base">📬</span>
                <span>Code sent! If not in your inbox, please check your <strong>Spam / Junk folder</strong>.</span>
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-ink-700 dark:text-paper-300 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold py-3 px-4 rounded-xl border border-paper-300 dark:border-ink-700 bg-paper-50 dark:bg-ink-800 text-ink-900 dark:text-paper-100 focus:outline-none focus:ring-2 focus:ring-terracotta-500 transition-all placeholder:text-ink-300 dark:placeholder:text-paper-600"
                  required
                />
                <p className="text-[11px] text-center text-ink-400 dark:text-paper-500">
                  The code expires in 10 minutes.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoading}
                icon={ArrowRight}
                disabled={otpCode.trim().length !== 6}
              >
                Verify & Sign In
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('CREDENTIALS');
                    setOtpCode('');
                  }}
                  className="inline-flex items-center gap-1 text-ink-500 dark:text-paper-400 hover:text-ink-800 dark:hover:text-paper-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isResending}
                  className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                    resendCountdown > 0 || isResending
                      ? 'text-ink-400 dark:text-paper-600 cursor-not-allowed'
                      : 'text-terracotta-600 dark:text-terracotta-400 hover:underline cursor-pointer'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                  </span>
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-paper-100 dark:border-ink-800 text-center">
              <span className="text-[11px] text-ink-400 dark:text-paper-500">
                Can't find the email? Check your Spam or Promotions folder.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
