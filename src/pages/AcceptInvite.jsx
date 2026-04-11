import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const PASSWORD_MIN = 8;

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#DC2626', '#D97706', '#059669'];
  const labels = ['Weak', 'Fair', 'Strong'];
  if (!password) return null;
  return (
    <div className="mb-4">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all"
            style={{ background: i < score ? colors[score - 1] : '#E5E7EB' }} />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map(c => (
          <span key={c.label} className={`text-[10px] ${c.pass ? 'text-green-600' : 'text-gray-400'}`}>
            {c.pass ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pageState, setPageState] = useState('loading');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(token)) {
      toast.error('Invalid invite link');
      navigate('/login');
      return;
    }

    // Check if returning after email confirmation
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // User confirmed email and is back — complete profile linking
        await completeProfileLinking(session.user.id, session.user.email);
        return;
      }
      // Fresh visit — load invite details
      checkInvite();
    });
  }, [token]);

  async function completeProfileLinking(authId, userEmail) {
    setPageState('loading');
    try {
      // Find the profile by invite token
      const { data: profile } = await supabase
        .from('users')
        .select('id, auth_id')
        .eq('invite_token', token)
        .maybeSingle();

      if (profile && !profile.auth_id) {
        // Link auth to profile
        await supabase.from('users').update({
          auth_id: authId,
          email: userEmail,
          invite_accepted_at: new Date().toISOString(),
          invite_token: null,
          status: 'active',
        }).eq('id', profile.id);
      }

      toast.success('Account confirmed! Welcome to VEA Hub 🎉');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Profile linking failed:', err);
      toast.error('Account setup failed. Please contact your admin.');
      navigate('/login');
    }
  }

  async function checkInvite() {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role, invite_token')
      .eq('invite_token', token)
      .is('invite_accepted_at', null)
      .single();

    if (error || !data) {
      toast.error('This invite link is invalid or has already been used.');
      navigate('/login');
      return;
    }
    setInvite(data);
    setPageState('form');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return toast.error('Please enter a valid email address');
    }
    if (password.length < PASSWORD_MIN) {
      return toast.error(`Password must be at least ${PASSWORD_MIN} characters`);
    }
    if (password !== confirmPw) {
      return toast.error('Passwords do not match');
    }

    setPageState('submitting');
    try {
      // Step 1: Update the users table with real email FIRST
      const { error: emailErr } = await supabase
        .from('users')
        .update({ email: trimmedEmail })
        .eq('id', invite.id)
        .is('auth_id', null);

      if (emailErr) throw new Error('Email may already be in use by another account.');

      // Step 2: Create Supabase auth account
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          // Redirect back to this invite page after email confirmation
          emailRedirectTo: `${window.location.origin}/invite/${token}`,
        },
      });

      if (error) {
        // Revert email update if auth failed
        await supabase.from('users').update({
          email: `pending_${token}@afrivahubteam.com`
        }).eq('id', invite.id);
        throw error;
      }

      // Step 3a: Email confirmation OFF — link immediately and log in
      if (data.session) {
        await supabase.from('users').update({
          auth_id: data.user.id,
          invite_accepted_at: new Date().toISOString(),
          invite_token: null,
          status: 'active',
        }).eq('id', invite.id);

        toast.success('Account created! Welcome to VEA Hub 🎉');
        navigate('/', { replace: true });
        return;
      }

      // Step 3b: Email confirmation ON — tell user to check email
      setPageState('check-email');
      toast.success('Check your email and click the confirmation link!', { duration: 8000 });

    } catch (err) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Failed to create account. Please try again.');
      setPageState('form');
    }
  }

  const roleLabels = {
    vea: 'Virtual Executive Assistant',
    manager: 'Manager',
    super_manager: 'Super Manager',
    owner: 'Platform Owner',
  };

  if (pageState === 'loading') return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Setting up your account...</p>
      </div>
    </div>
  );

  if (pageState === 'submitting') return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Creating your account...</p>
      </div>
    </div>
  );

  if (pageState === 'check-email') return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-orange to-brand-amber flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-4">A</div>
        <div className="bg-white rounded-xl border border-surface-border p-8 shadow-sm">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-lg font-bold text-brand-dark mb-2">Check Your Email</h2>
          <p className="text-gray-500 text-sm mb-2">We sent a confirmation link to:</p>
          <p className="text-brand-orange font-semibold text-sm mb-4">{email}</p>
          <p className="text-gray-400 text-xs">Click the link in your email to activate your account. After confirming, you'll be redirected back here automatically.</p>
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">⚠️ Check your spam folder if you don't see it within 2 minutes.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-orange to-brand-amber flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-4"
            style={{ boxShadow: '0 8px 32px rgba(232,114,74,0.25)' }}>A</div>
          <h1 className="font-display text-2xl font-extrabold text-brand-dark">
            Welcome to <span className="text-brand-orange">VEA Hub</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Complete your account setup</p>
        </div>

        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-sm">
          {invite && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5 text-center">
              <p className="text-xs text-green-600 font-medium">You've been invited as</p>
              <p className="text-base font-bold text-green-800 mt-0.5">{invite.name}</p>
              <p className="text-xs text-green-600">{roleLabels[invite.role] || invite.role}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              autoComplete="email" placeholder="you@example.com"
              className="w-full px-3 py-2.5 bg-surface-muted border border-surface-border rounded-lg text-sm outline-none focus:border-brand-orange transition mb-4" />

            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Create Password</label>
            <div className="relative mb-2">
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 bg-surface-muted border border-surface-border rounded-lg text-sm outline-none focus:border-brand-orange transition pr-10" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs" tabIndex={-1}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <PasswordStrength password={password} />

            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Confirm Password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
              autoComplete="new-password" placeholder="Repeat your password"
              className={`w-full px-3 py-2.5 bg-surface-muted border rounded-lg text-sm outline-none transition mb-5
                ${confirmPw && confirmPw !== password ? 'border-red-300' : 'border-surface-border focus:border-brand-orange'}`} />
            {confirmPw && confirmPw !== password && (
              <p className="text-[10px] text-red-500 -mt-4 mb-4">Passwords don't match</p>
            )}

            <button type="submit"
              disabled={pageState === 'submitting' || (confirmPw && confirmPw !== password)}
              className="w-full py-2.5 bg-gradient-to-r from-brand-orange to-brand-amber text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              Create My Account
            </button>
          </form>
        </div>
        <p className="text-center mt-4 text-xs text-gray-400">🔒 This link is single-use and expires once used.</p>
      </div>
    </div>
  );
}
