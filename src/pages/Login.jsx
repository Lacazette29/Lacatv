import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Simple client-side rate limiting
const loginAttempts = { count: 0, lastAttempt: 0, lockedUntil: 0 };
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const checkRateLimit = useCallback(() => {
    const now = Date.now();

    // Check if currently locked out
    if (loginAttempts.lockedUntil > now) {
      const minutesLeft = Math.ceil((loginAttempts.lockedUntil - now) / 60000);
      toast.error(`Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`);
      return false;
    }

    // Reset counter if last attempt was long ago
    if (now - loginAttempts.lastAttempt > LOCKOUT_MS) {
      loginAttempts.count = 0;
    }

    return true;
  }, []);

  const recordFailedAttempt = useCallback(() => {
    loginAttempts.count += 1;
    loginAttempts.lastAttempt = Date.now();
    if (loginAttempts.count >= MAX_ATTEMPTS) {
      loginAttempts.lockedUntil = Date.now() + LOCKOUT_MS;
      loginAttempts.count = 0;
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();

    if (!checkRateLimit()) return;

    // Basic input validation
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signIn(trimmedEmail, password);
      loginAttempts.count = 0; // Reset on success
      navigate('/');
    } catch (err) {
      recordFailedAttempt();
      const remaining = MAX_ATTEMPTS - loginAttempts.count;
      if (remaining <= 2 && remaining > 0) {
        toast.error(`Invalid credentials. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`);
      } else {
        toast.error('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return toast.error('Enter your email address first');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return toast.error('Please enter a valid email address');
    }

    setLoading(true);
    try {
      await resetPassword(trimmedEmail);
      // Always show success — don't reveal if email exists (security)
      toast.success('If that email exists, a reset link has been sent.');
      setShowReset(false);
    } catch (err) {
      toast.error('Unable to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-orange to-brand-amber flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-4"
            style={{ boxShadow: '0 8px 32px rgba(232,114,74,0.25)' }}
          >A</div>
          <h1 className="font-display text-2xl font-extrabold text-brand-dark">
            AfriVAHub <span className="text-brand-orange">VEA Hub</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {showReset ? 'Reset your password' : 'Sign in to your workspace'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm">
          <form onSubmit={showReset ? handleReset : handleLogin} autoComplete="on">

            {/* Email */}
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@afrivahubteam.com"
              className="w-full px-3 py-2.5 bg-surface-muted border border-surface-border rounded-lg text-sm outline-none focus:border-brand-orange transition mb-4"
            />

            {/* Password (hidden in reset mode) */}
            {!showReset && (
              <>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Password
                </label>
                <div className="relative mb-5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-3 py-2.5 bg-surface-muted border border-surface-border rounded-lg text-sm outline-none focus:border-brand-orange transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-brand-orange to-brand-amber text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Please wait...' : showReset ? 'Send Reset Link' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-4 text-xs text-gray-500">
            {showReset ? (
              <button onClick={() => setShowReset(false)} className="text-brand-orange font-semibold hover:underline">
                ← Back to Sign In
              </button>
            ) : (
              <button onClick={() => setShowReset(true)} className="text-brand-orange font-semibold hover:underline">
                Forgot password?
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-4 text-xs text-gray-400">
          🔒 Invite-only. Contact your manager for access.
        </p>
        <p className="text-center mt-1 text-xs text-gray-300">veahub.afrivahubteam.com</p>
      </div>
    </div>
  );
}
