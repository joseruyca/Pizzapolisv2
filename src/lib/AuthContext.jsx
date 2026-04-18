import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'pizzapolis_current_user';

function getFallbackProfile(user) {
  const emailName = user?.email?.split('@')[0] || 'usuario';
  return {
    id: user?.id,
    email: user?.email || '',
    username: user?.user_metadata?.username || emailName,
    avatar_url: user?.user_metadata?.avatar_url || '',
    role: user?.app_metadata?.role || 'user',
  };
}

async function ensureProfile(user) {
  if (!supabase || !user) return null;

  const fallbackProfile = getFallbackProfile(user);

  try {
    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingError && existing) {
      return { ...fallbackProfile, ...existing };
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: fallbackProfile.username,
      avatar_url: fallbackProfile.avatar_url,
      role: fallbackProfile.role,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.warn('Profile upsert fallback:', error.message || error);
      return fallbackProfile;
    }

    return { ...fallbackProfile, ...(data || {}) };
  } catch (error) {
    console.warn('Profile sync fallback:', error?.message || error);
    return fallbackProfile;
  }
}

function bridgeUser(user, profile) {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }

  const resolvedProfile = profile || getFallbackProfile(user);
  const displayName = user.user_metadata?.full_name || resolvedProfile.username || user.email || 'Usuario';

  const bridged = {
    id: user.id,
    email: user.email,
    full_name: displayName,
    username: resolvedProfile.username || user.email?.split('@')[0] || 'user',
    role: resolvedProfile.role || user.app_metadata?.role || 'user',
    avatar_url: resolvedProfile.avatar_url || '',
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

  const clearSession = useCallback(() => {
    bridgeUser(null, null);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  }, []);

  const syncSession = useCallback(async (sessionUser) => {
    if (!isSupabaseConfigured || !sessionUser) {
      clearSession();
      return;
    }

    const fallbackProfile = getFallbackProfile(sessionUser);
    const immediateUser = bridgeUser(sessionUser, fallbackProfile);
    setUser(immediateUser);
    setProfile(fallbackProfile);
    setIsAuthenticated(true);

    try {
      const resolvedProfile = await ensureProfile(sessionUser);
      const bridged = bridgeUser(sessionUser, resolvedProfile || fallbackProfile);
      setUser(bridged);
      setProfile(resolvedProfile || fallbackProfile);
    } catch (error) {
      console.warn('Auth sync profile fallback:', error?.message || error);
      setProfile(fallbackProfile);
    }
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!isSupabaseConfigured) {
        setAuthError({ type: 'config_missing', message: 'Supabase no está configurado.' });
        setIsLoadingAuth(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        if (data.session?.user) {
          await syncSession(data.session.user);
        } else {
          clearSession();
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Session restore error:', error);
        clearSession();
        setAuthError({ type: 'session_error', message: error.message || 'No se pudo restaurar la sesión.' });
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    }

    init();

    const { data: listener } = isSupabaseConfigured
      ? supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted) return;
          await syncSession(session?.user || null);
          setIsLoadingAuth(false);
        })
      : { data: { subscription: { unsubscribe() {} } } };

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [clearSession, syncSession]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await syncSession(data?.user || data?.session?.user || null);
    setIsLoadingAuth(false);
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
    clearSession();
  };

  const navigateToLogin = () => {
    window.location.href = '/auth';
  };

  const checkAppState = async () => {
    if (!supabase) {
      clearSession();
      return;
    }
    const { data } = await supabase.auth.getSession();
    await syncSession(data.session?.user || null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || user?.role || 'user',
        isAdmin: (profile?.role || user?.role) === 'admin',
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
