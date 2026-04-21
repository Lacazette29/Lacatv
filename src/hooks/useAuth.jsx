import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFetching = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted.current) return;
      if (error || !session?.user) {
        setLoading(false);
        return;
      }
      fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted.current) return;

      if (event === 'SIGNED_OUT') {
        isFetching.current = false;
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_IN' && session?.user) {
        fetchProfile(session.user.id);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        if (!profile) fetchProfile(session.user.id);
        return;
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(authId) {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const { data, error } = await Promise.race([
        supabase
          .from('users')
          .select('*')
          .eq('auth_id', authId)
          .eq('status', 'active')
          .single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        ),
      ]);

      if (!mounted.current) return;

      if (error || !data) {
        console.error('Profile not found for auth_id:', authId);
        setProfile(null);
        await supabase.auth.signOut();
      } else {
        setProfile(data);
        supabase.from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id)
          .then(() => {});
      }
    } catch (err) {
      console.error('fetchProfile failed:', err.message);
      if (mounted.current) setProfile(null);
    } finally {
      isFetching.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    setProfile(null);
    setLoading(false);
    isFetching.current = false;
    await supabase.auth.signOut();
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
    });
    if (error) throw error;
  }

  const isOwner = profile?.role === 'owner';
  const isSuperManager = profile?.role === 'super_manager' || isOwner;
  const isManager = profile?.role === 'manager' || isSuperManager;
  const isVEA = profile?.role === 'vea';

  return (
    <AuthContext.Provider value={{
      profile, user: profile, loading,
      signIn, signOut, resetPassword,
      isOwner, isSuperManager, isManager, isVEA,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
