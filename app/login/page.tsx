'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Confirmation link was invalid or expired. Please sign up again or request a new link.',
  callback_failed: 'We couldn’t complete sign in. Please try again or use the link from your email.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  // UX Enhancements
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const signupSuccess = searchParams.get('signup') === 'success';

  const navigateNext = () => {
    const nextParam = searchParams.get('next') ?? '/dashboard';
    const destination = nextParam.startsWith('/') ? nextParam : `/${nextParam}`;
    router.push(destination);
    router.refresh();
  };

  // Restore remembered email on initial mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('primecfo_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Storage unavailable or restricted
    }
  }, []);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err && ERROR_MESSAGES[err]) {
      setError(ERROR_MESSAGES[err]);
    }
  }, [searchParams]);

  // Monitor Caps Lock status for password input
  const handlePasswordKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Save or clear remembered email
    try {
      if (rememberMe && email.trim()) {
        localStorage.setItem('primecfo_remembered_email', email.trim().toLowerCase());
      } else {
        localStorage.removeItem('primecfo_remembered_email');
      }
    } catch {
      // Ignore storage errors
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? 'Sign in failed');
        setLoading(false);
        return;
      }

      if (data.mfaRequired && data.factorId) {
        setMfaFactorId(data.factorId);
        setLoading(false);
        return;
      }

      navigateNext();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const verifyMfaCode = async (codeToVerify: string) => {
    if (!mfaFactorId || codeToVerify.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: mfaFactorId, code: codeToVerify, email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? 'Verification failed');
        setLoading(false);
        return;
      }

      navigateNext();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyMfaCode(mfaCode);
  };

  const handleMfaChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 6);
    setMfaCode(cleanDigits);
    if (error) setError('');
    // Auto-verify when 6th digit is typed
    if (cleanDigits.length === 6 && mfaFactorId) {
      verifyMfaCode(cleanDigits);
    }
  };

  const handleMfaPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanDigits = pastedText.replace(/\D/g, '').slice(0, 6);
    if (cleanDigits) {
      setMfaCode(cleanDigits);
      if (error) setError('');
      if (cleanDigits.length === 6 && mfaFactorId) {
        verifyMfaCode(cleanDigits);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-semibold tracking-tight">
              <span className="text-emerald-400">P</span>rimeCFO.ai
            </span>
          </Link>
          <Link
            href="/signup"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Create an account
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-6 py-16 flex-1 flex flex-col justify-center w-full">
        <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>

          <h1 className="text-2xl font-semibold text-center mb-2">
            {mfaFactorId ? 'Two-factor verification' : 'Sign in'}
          </h1>
          <p className="text-white/60 text-center text-sm mb-6">
            {mfaFactorId
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'Use the email and password you signed up with.'}
          </p>

          {mfaFactorId ? (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-white/80 mb-1.5">
                  Authentication code
                </label>
                <input
                  id="mfaCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => handleMfaChange(e.target.value)}
                  onPaste={handleMfaPaste}
                  required
                  autoFocus
                  disabled={loading}
                  aria-invalid={!!error}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg tracking-[0.4em] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors disabled:opacity-60"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div 
                  role="alert"
                  aria-live="polite"
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || mfaCode.length < 6}
                className="w-full py-3 px-4 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <span>Verify & sign in</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaFactorId(null);
                  setMfaCode('');
                  setError('');
                }}
                disabled={loading}
                className="w-full text-center text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer py-1"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none z-10" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                    disabled={loading}
                    aria-invalid={!!error}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors disabled:opacity-60"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none z-10" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onKeyDown={handlePasswordKeyActivity}
                    onKeyUp={handlePasswordKeyActivity}
                    required
                    disabled={loading}
                    aria-invalid={!!error}
                    className="w-full pl-10 pr-11 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors disabled:opacity-60"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-emerald-400 focus:outline-none focus:text-emerald-400 transition-colors cursor-pointer z-10 flex items-center justify-center rounded-lg"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-300 hover:text-emerald-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-300 hover:text-emerald-400" />
                    )}
                  </button>
                </div>

                {capsLockOn && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-300/90 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Caps Lock is ON</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Help Links */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 accent-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                  />
                  <span>Remember my email</span>
                </label>
                <Link
                  href="/contact"
                  className="text-white/40 hover:text-emerald-400 transition-colors"
                >
                  Need help?
                </Link>
              </div>

              {signupSuccess && !error && (
                <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  Account created. Sign in with your email and password.
                </p>
              )}

              {error && (
                <div 
                  role="alert"
                  aria-live="polite"
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          )}

          {!mfaFactorId && (
            <p className="mt-6 text-center text-sm text-white/50">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
