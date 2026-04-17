import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'pizzapolis_current_user';

async function ensureProfile(user) {
  if (!supabase || !user) return null;
  const metadataName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const insertPayload = {
    id: user.id,
    email: user.email,
    full_name: metadataName,
    username: user.email?.split('@')[0] || `user-${user.id.slice(0, 6)}`,
    role: 'user',
  };
  const { data, error } = await supabase.from('profiles').insert(insertPayload).select('*').single();
  if (error) {
    console.error('Error creating profile:', error);
    return insertPayload;
  }
  return data || insertPayload;
}

function bridgeUser(user, profile) {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
  const bridged = {
    id: user.id,
    email: user.email,
    full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
    username: profile?.username || user.email?.split('@')[0] || 'user',
    role: profile?.role || user.app_metadata?.role || 'user',
    avatar_url: profile?.avatar_url || '',
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(bridged));
  return bridged;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ localMode: false });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsLoadingAuth((current) => current ? false : current);
    }, 7000);
    return () => window.clearTimeout(timeout);
  }, []);

  const syncSession = useCallback(async (sessionUser) => {
    if (!isSupabaseConfigured || !sessionUser) {
      bridgeUser(null, null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      return;
    }
    const p = await ensureProfile(sessionUser);
    const bridged = bridgeUser(sessionUser, p);
    setUser(bridged);
    setProfile(p);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!isSupabaseConfigured) {
        setAuthError({ type: 'config_missing', message: 'Supabase no está configurado.' });
        setIsLoadingAuth(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session?.user) {
          await syncSession(data.session.user);
        } else {
          bridgeUser(null, null);
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        if (!mounted) return;
        setAuthError({ type: 'session_error', message: error.message || 'No se pudo restaurar la sesión.' });
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    }
    init();
    const { data: listener } = isSupabaseConfigured
      ? supabase.auth.onAuthStateChange(async (_event, session) => {
          await syncSession(session?.user || null);
          setIsLoadingAuth(false);
        })
      : { data: { subscription: { unsubscribe() {} } } };
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [syncSession]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      await syncSession(data.user);
    } else {
      const session = await supabase.auth.getSession();
      await syncSession(session?.data?.session?.user || null);
    }
    return data;
  };

  const signUp = async ({ email, password, fullName }) => {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl.replace(/\/$/, '')}/auth/confirm`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    bridgeUser(null, null);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    window.location.href = '/auth';
  };

  const checkAppState = async () => {
    const { data } = await supabase.auth.getSession();
    await syncSession(data.session?.user || null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || user?.role || 'user',
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        signIn,
        signUp,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
