import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar } from '../components/identity/Avatar.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { 
  Lock, 
  Mail, 
  RefreshCw, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  KeyRound
} from 'lucide-react';

const TOPIC_OPTIONS = [
  { slug: 'ai', name: 'Artificial Intelligence' },
  { slug: 'technology', name: 'Technology' },
  { slug: 'programming', name: 'Programming' },
  { slug: 'cybersecurity', name: 'Cybersecurity' },
  { slug: 'career', name: 'Career & Work' },
  { slug: 'science', name: 'Science' },
  { slug: 'gaming', name: 'Gaming' },
  { slug: 'movies', name: 'Cinema & Film' },
  { slug: 'music', name: 'Music' },
  { slug: 'travel', name: 'Travel & Nomad' },
  { slug: 'finance', name: 'Finance & Economy' },
  { slug: 'life', name: 'Life & Philosophy' },
  { slug: 'opinions', name: 'Unpopular Opinions' },
  { slug: 'relationships', name: 'Relationships' },
  { slug: 'sports', name: 'Sports' }
];

const PREVIEW_NAMES = ["Fox", "Raven", "Pixel", "Moon", "Phoenix", "Nebula", "Cipher", "Atlas"];
const PREVIEW_SHAPES = ["geometric", "celestial", "organic", "elemental"];
const PREVIEW_COLORS = ["#6366F1", "#8B5CF6", "#06B6D4", "#10B981", "#F97316", "#EC4899"];

const STEPS = [
  { id: 1, label: 'Credentials' },
  { id: 2, label: 'Interests' },
  { id: 3, label: 'Identity' },
  { id: 4, label: 'Verify' }
];

export function Register() {
  const { sendOtp, verifyOtp, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedInterests, setSelectedInterests] = useState(['technology', 'ai', 'opinions']);
  const [identityPreference, setIdentityPreference] = useState('PERSISTENT');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const otpInputRef = useRef(null);

  // Preview generated identity
  const [previewName, setPreviewName] = useState('Anonymous Fox');
  const [previewShape, setPreviewShape] = useState('organic');
  const [previewColor, setPreviewColor] = useState('#F97316');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Focus OTP input when arriving at step 4
  useEffect(() => {
    if (step === 4 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  if (!loading && isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const regeneratePreview = () => {
    const name = `Anonymous ${PREVIEW_NAMES[Math.floor(Math.random() * PREVIEW_NAMES.length)]}`;
    const shape = PREVIEW_SHAPES[Math.floor(Math.random() * PREVIEW_SHAPES.length)];
    const color = PREVIEW_COLORS[Math.floor(Math.random() * PREVIEW_COLORS.length)];
    setPreviewName(name);
    setPreviewShape(shape);
    setPreviewColor(color);
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    const errs = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) errs.email = "Please enter a valid email address.";
    if (!password || password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const toggleInterest = (slug) => {
    setSelectedInterests(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  // Step 3 -> Step 4: Request OTP email
  const handleRequestVerification = async () => {
    try {
      setIsSubmitting(true);
      const res = await sendOtp({ email, purpose: 'REGISTER' });
      if (res.success) {
        setStep(4);
        setResendCountdown(60);
        if (res.devCode) {
          setOtpCode(res.devCode);
          toast.info(`Verification code: ${res.devCode}`);
        } else {
          toast.success(res.message || `Verification code dispatched to ${email}`);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to send verification code.");
      if (err.message && err.message.toLowerCase().includes('already exists')) {
        setStep(1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Verify OTP and finalize registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await verifyOtp({
        email,
        code: cleanCode,
        purpose: 'REGISTER',
        password,
        interests: selectedInterests,
        identityPreference
      });

      if (res.success) {
        toast.success("Email verified! Welcome to FreeTalk.");
        navigate('/home', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || "Invalid or expired code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending) return;

    try {
      setIsResending(true);
      const res = await sendOtp({ email, purpose: 'REGISTER' });
      if (res.success) {
        setResendCountdown(60);
        toast.success("A fresh verification code has been dispatched to your email.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-lg rounded-xl border border-paper-200 dark:border-ink-800 p-8 sm:p-9 bg-white dark:bg-ink-850 shadow-card">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-paper-100 dark:border-ink-800">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                  step === s.id
                    ? 'bg-terracotta-600 text-white'
                    : step > s.id
                    ? 'bg-olive-50 text-olive-800 border border-olive-200 dark:bg-olive-950/60 dark:text-olive-300 dark:border-olive-800'
                    : 'bg-paper-200 text-ink-400 dark:bg-ink-800 dark:text-paper-400'
                }`}
              >
                {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step === s.id ? 'text-ink-900 dark:text-paper-100' : 'text-ink-400 dark:text-paper-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: Account Credentials */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-paper-100">Create Private Account</h2>
              <p className="text-xs text-ink-500 dark:text-paper-400 mt-1 font-sans">
                Your email is strictly used for authentication and is never publicly visible.
              </p>
            </div>

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            <Input
              label="Password (min. 8 characters)"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" className="w-full" icon={ArrowRight}>
                Continue to Interests
              </Button>
            </div>

            <div className="text-center text-xs text-ink-500 dark:text-paper-400 pt-3">
              Already have an account?{' '}
              <Link to="/login" className="text-terracotta-600 dark:text-terracotta-400 hover:underline font-semibold">
                Sign in
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Choose Interests */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-paper-100">What are you interested in?</h2>
              <p className="text-xs text-ink-500 dark:text-paper-400 mt-1 font-sans">
                Select topics to customize your discussion feed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
              {TOPIC_OPTIONS.map((t) => {
                const isSelected = selectedInterests.includes(t.slug);
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => toggleInterest(t.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-800 dark:bg-terracotta-950/40 dark:text-terracotta-300 dark:border-terracotta-800 font-semibold'
                        : 'border-paper-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-800/60 text-ink-600 dark:text-paper-300 hover:border-paper-300'
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-paper-100 dark:border-ink-800">
              <Button variant="ghost" size="md" onClick={() => setStep(1)} icon={ArrowLeft}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setStep(3)}
                icon={ArrowRight}
              >
                Generate Identity
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Anonymous Identity Generator */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-paper-100">Your Anonymous Persona</h2>
              <p className="text-xs text-ink-500 dark:text-paper-400 mt-1 font-sans">
                To preserve genuine ideas over personal vanity, FreeTalk assigns you an abstract anonymous identity. Real names are disabled by design.
              </p>
            </div>

            {/* Generated Identity Preview Box */}
            <div className="p-6 rounded-xl bg-paper-50 dark:bg-ink-800/60 border border-paper-200 dark:border-ink-700 flex flex-col items-center shadow-subtle">
              <Avatar
                seed={previewName}
                shape={previewShape}
                color={previewColor}
                size="xl"
                className="mb-3"
              />
              <div className="font-serif text-lg font-bold text-ink-900 dark:text-paper-100 mb-1">{previewName}</div>
              <div className="text-xs text-olive-700 dark:text-olive-300 font-medium">🌱 New Voice</div>

              <button
                type="button"
                onClick={regeneratePreview}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-paper-100 hover:bg-paper-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-700 dark:text-paper-200 border border-paper-200 dark:border-ink-700 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400" />
                <span>Regenerate Identity</span>
              </button>
            </div>

            {/* Anonymity Mode Choice */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-500 dark:text-paper-400">
                Identity Persistence Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIdentityPreference('PERSISTENT')}
                  className={`p-3 rounded-lg border text-xs text-left transition-all ${
                    identityPreference === 'PERSISTENT'
                      ? 'border-terracotta-500 bg-terracotta-50/50 dark:bg-terracotta-950/30 text-ink-900 dark:text-paper-100 font-semibold'
                      : 'border-paper-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-800/40 text-ink-600 dark:text-paper-400'
                  }`}
                >
                  <div className="font-bold mb-0.5">Persistent Alias</div>
                  <div className="text-[10px] text-ink-500 dark:text-paper-400">Keeps the same anonymous persona across discussions.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setIdentityPreference('TEMPORARY')}
                  className={`p-3 rounded-lg border text-xs text-left transition-all ${
                    identityPreference === 'TEMPORARY'
                      ? 'border-terracotta-500 bg-terracotta-50/50 dark:bg-terracotta-950/30 text-ink-900 dark:text-paper-100 font-semibold'
                      : 'border-paper-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-800/40 text-ink-600 dark:text-paper-400'
                  }`}
                >
                  <div className="font-bold mb-0.5">Fully Disappearing</div>
                  <div className="text-[10px] text-ink-500 dark:text-paper-400">Fresh anonymous identities for different discussions.</div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-paper-100 dark:border-ink-800">
              <Button variant="ghost" size="md" onClick={() => setStep(2)} icon={ArrowLeft}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleRequestVerification}
                isLoading={isSubmitting}
                icon={Mail}
              >
                Send Verification Code
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Email OTP Verification */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-600 dark:text-terracotta-400 border border-terracotta-200 dark:border-terracotta-800/60 flex items-center justify-center mx-auto shadow-subtle">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink-900 dark:text-paper-100">
                Verify Your Gmail
              </h2>
              <p className="text-xs text-ink-500 dark:text-paper-400 max-w-xs mx-auto">
                We've sent a 6-digit verification code to{' '}
                <span className="font-semibold text-ink-800 dark:text-paper-200">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
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
                isLoading={isSubmitting}
                icon={Sparkles}
                disabled={otpCode.trim().length !== 6}
              >
                Verify & Activate FreeTalk
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(3);
                    setOtpCode('');
                  }}
                  className="inline-flex items-center gap-1 text-ink-500 dark:text-paper-400 hover:text-ink-800 dark:hover:text-paper-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Persona</span>
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

            {/* Security Assurance */}
            <div className="pt-3 border-t border-paper-100 dark:border-ink-800 flex items-center justify-center gap-1.5 text-[11px] text-olive-700 dark:text-olive-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Public Profile Exposure • Verified Human</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
