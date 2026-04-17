'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getFriendlyErrorMessage } from '@/utils/errorUtils';
import { api } from '@/lib/api';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import NexusLogo from '@/assets/Logo/Logo with no circle.svg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const updateTimers = () => {
      const lockoutStr = localStorage.getItem('nexus_auth_lockout_until');
      if (lockoutStr) {
        const lockoutTime = parseInt(lockoutStr, 10);
        const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
        setLockoutTimer(remaining);
        if (remaining === 0) {
          localStorage.removeItem('nexus_auth_lockout_until');
          localStorage.setItem('nexus_auth_resend_attempts', '0');
        }
      }
    };

    updateTimers();
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
      updateTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatLockoutTimer = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m ${seconds % 60}s`;
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || lockoutTimer > 0) return;
    
    setError(null);
    const attempts = parseInt(localStorage.getItem('nexus_auth_resend_attempts') || '0', 10) + 1;
    const level = parseInt(localStorage.getItem('nexus_auth_lockout_level') || '0', 10);
    
    try {
      await api.auth.requestVerification({
        email,
        password,
        displayName: displayName || undefined,
        provider: 'email',
      });
      
      localStorage.setItem('nexus_auth_resend_attempts', attempts.toString());
      
      if (attempts >= 3) {
        const newLevel = level + 1;
        localStorage.setItem('nexus_auth_lockout_level', newLevel.toString());
        const hours = newLevel === 1 ? 1 : 3;
        const lockoutTime = Date.now() + (hours * 60 * 60 * 1000);
        localStorage.setItem('nexus_auth_lockout_until', lockoutTime.toString());
        setLockoutTimer(Math.ceil((lockoutTime - Date.now()) / 1000));
        setError(`Maximum attempts reached. Please try again in ${hours} hour${hours > 1 ? '' : 's'}.`);
      } else {
        setResendCooldown(15);
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const returnUrl = useAuthStore.getState().returnUrl || '/';
      await signIn('google', { callbackUrl: returnUrl });
    } catch (err: any) {
      setError('Google login failed: ' + (err.message || String(err)));
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If verifying, we already validated email and password
    if (mode === 'verify') {
      if (verificationCode.length !== 6) {
        setError('Please enter the 6-digit code');
        return;
      }
    } else {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }
      if (!validatePassword(password)) {
        setError('Password must be at least 6 characters with letters and numbers');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        // Step 1: Request Verification code
        await api.auth.requestVerification({
          email,
          password,
          displayName: displayName || undefined,
          provider: 'email',
        });
        setMode('verify');
        return;
      } else if (mode === 'verify') {
        // Step 2: Validate code and register
        await api.auth.register({
          email,
          password,
          displayName: displayName || undefined,
          provider: 'email',
          verificationCode
        });

        // Then sign in automatically
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password
        });

        if (result?.error) throw new Error(result.error);

        onClose();
        resetForm();
      } else {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password
        });

        if (result?.error) throw new Error('Invalid email or password');

        onClose();
        resetForm();
      }
    } catch (err: any) {
      // Special case: Signup succeeded but auto-login failed
      if (mode === 'signup' && (err.message?.includes('CredentialsSignin') || err.message?.includes('Invalid email or password'))) {
        setError('Account created successfully, but auto-login failed. Please sign in manually.');
        setMode('login');
        return;
      }

      const friendlyMsg = getFriendlyErrorMessage(err);

      if ((mode === 'signup' || mode === 'verify') && (friendlyMsg.includes('409') || friendlyMsg.toLowerCase().includes('already exists') || friendlyMsg.toLowerCase().includes('email already'))) {
        setError('An account with this email already exists. Please sign in instead.');
        setMode('login');
      } else if (friendlyMsg.includes('404') && mode === 'login') {
        setError('We couldn\'t find an account with that email. Please sign up.');
      } else if (friendlyMsg.includes('404') && (mode === 'signup' || mode === 'verify')) {
        setError('Registration service unavailable (404). Please try again later.');
      } else {
        setError(friendlyMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setVerificationCode('');
    setError(null);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 relative h-14 w-14">
            <Image src={NexusLogo} alt="Nexus Logo" fill className="object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : mode === 'verify' ? 'Verify your email' : 'Create account'}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === 'login'
              ? 'Sign in to access your social study projects'
              : mode === 'verify'
              ? 'Enter the 6-digit code sent to ' + email
              : 'Start building your social study projects today'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'verify' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300">Verification Code</label>
              <div className="relative mt-2">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-xl tracking-widest rounded-lg bg-zinc-800 py-3 px-4 text-white placeholder-zinc-500 outline-none ring-1 ring-zinc-700 transition-all  -[#265fbd]"
                  required
                />
              </div>
            </div>
          )}

          {mode !== 'verify' && mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300">Display Name</label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg bg-zinc-800 py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-zinc-700 transition-all  -[#265fbd]"
                />
              </div>
            </div>
          )}

          {mode !== 'verify' && (
          <div>
            <label className="block text-sm font-medium text-zinc-300">Email</label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-zinc-800 py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-zinc-700 transition-all  -[#265fbd]"
                required
              />
            </div>
          </div>
          )}

          {mode !== 'verify' && (
          <div>
            <label className="block text-sm font-medium text-zinc-300">Password</label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-zinc-800 py-3 pl-11 pr-12 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-zinc-700 transition-all  -[#265fbd]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="mt-2 text-xs text-zinc-500">
                At least 6 characters with letters and numbers
              </p>
            )}
          </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#355ea1] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#265fbd] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {mode === 'login' ? 'Signing in...' : mode === 'verify' ? 'Verifying...' : 'Creating account...'}
              </>
            ) : (
              mode === 'login' ? 'Sign in' : mode === 'verify' ? 'Verify & Continue' : 'Create account'
            )}
          </button>
        </form>

        {mode !== 'verify' && (
          <>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-500">OR</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <button
              type="button"
              onClick={() => {
                if (isGoogleLoading) {
                  setIsGoogleLoading(false);
                } else {
                  handleGoogleLogin();
                }
              }}
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isGoogleLoading ? 'Connecting... (Click to Cancel)' : 'Continue with Google'}
            </button>
          </>
        )}

        <div className="mt-6 text-center">
          {mode === 'verify' ? (
            <p className="text-sm text-zinc-400">
              Didn't receive a code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || lockoutTimer > 0 || isSubmitting}
                className="font-medium text-[#355ea1] hover:text-[#6c9ff5] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lockoutTimer > 0
                  ? `Try again in ${formatLockoutTimer(lockoutTimer)}`
                  : resendCooldown > 0
                  ? `Resend code (${resendCooldown}s)`
                  : 'Resend code'}
              </button>
            </p>
          ) : (
            <p className="text-sm text-zinc-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={switchMode}
                className="font-medium text-[#355ea1] hover:text-[#6c9ff5]"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
