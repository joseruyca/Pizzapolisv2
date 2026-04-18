import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'pizzapolis_current_user';

function getFallbackProfile(user) {
  const emailName = user?.email?.split('@')[0] || 'usuario';
  return {
    id: user?.id,
    email: user?.email || '',
    username: user?.user_metadata?.username || user?.user_metadata?.full_name || emailName,
    avatar_url: user?.user_metadata?.avatar_url || '',
    role: user?.app_metadata?.role || 'user',
  };
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

async function loadOrCreateProfile(sessionUser) {
  if (!supabase || !sessionUser) return null;

  const fallbackProfile = getFallbackProfile(sessionUser);
  const selectProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,username,avatar_url,role')
      .eq('id', sessionUser.id)
      .maybeSingle();
    return { data, error };
  };

  let { data: existing, error: selectError } = await selectProfile();

  if (selectError) {
    console.warn('Profile select failed:', selectError.message || selectError);
  }

  if (existing) {
    return { ...fallbackProfile, ...existing };
  }

  const insertPayload = {
    id: sessionUser.id,
    email: sessionUser.email,
    username: fallbackProfile.username,
    avatar_url: fallbackProfile.avatar_url,
  };

  const { error: insertError } = await supabase.from('profiles').insert(insertPayload);
  if (insertError && !String(insertError.message || '').toLowerCase().includes('duplicate')) {
    console.warn('Profile insert fallback:', insertError.message || insertError);
  }

  await new Promise((resolve) => setTimeout(resolve, 120));
  const { data: created, error: createdError } = await selectProfile();

  if (createdError) {
    console.warn('Profile reload fallback:', createdError.message || createdError);
    return fallbackProfile;
  }

  return { ...fallbackProfile, ...(created || {}) };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ localMode: false });
  const mountedRef = useRef(true);

  const clearSession = useCallback(() => {
    bridgeUser(null, null);
    if (!mountedRef.current) return;
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  }, []);

  const applySession = useCallback((sessionUser) => {
    if (!mountedRef.current) return;

    if (!sessionUser) {
      clearSession();
      return;
    }

    const fallbackProfile = getFallbackProfile(sessionUser);
    const bridged = bridgeUser(sessionUser, fallbackProfile);
    setUser(bridged);
    setProfile((prev) => prev?.id === fallbackProfile.id ? { ...fallbackProfile, ...prev } : fallbackProfile);
    setIsAuthenticated(true);
  }, [clearSession]);

  const syncProfile = useCallback(async (sessionUser) => {
    if (!isSupabaseConfigured || !sessionUser || !mountedRef.current) return;

    try {
      const resolvedProfile = await loadOrCreateProfile(sessionUser);
      if (!mountedRef.current || !resolvedProfile) return;
      const bridged = bridgeUser(sessionUser, resolvedProfile);
      setUser(bridged);
      setProfile(resolvedProfile);
      setIsAuthenticated(true);
    } catch (error) {
      console.warn('Auth sync profile fallback:', error?.message || error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      if (!isSupabaseConfigured) {
        setAuthError({ type: 'config_missing', message: 'Supabase no está configurado.' });
        setIsLoadingAuth(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const sessionUser = data.session?.user || null;
        applySession(sessionUser);
        setIsLoadingAuth(false);

        if (sessionUser) {
          void syncProfile(sessionUser);
        }
      } catch (error) {
        console.error('Session restore error:', error);
        clearSession();
        setAuthError({ type: 'session_error', message: error.message || 'No se pudo restaurar la sesión.' });
        setIsLoadingAuth(false);
      }
    }

    init();

    const { data: listener } = isSupabaseConfigured
      ? supabase.auth.onAuthStateChange((_event, session) => {
          const sessionUser = session?.user || null;
          applySession(sessionUser);
          setIsLoadingAuth(false);

          if (sessionUser) {
            setTimeout(() => {
              void syncProfile(sessionUser);
            }, 0);
          }
        })
      : { data: { subscription: { unsubscribe() {} } } };

    return () => {
      mountedRef.current = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [applySession, clearSession, syncProfile]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const sessionUser = data?.user || data?.session?.user || null;
    applySession(sessionUser);
    setIsLoadingAuth(false);
    if (sessionUser) {
      await syncProfile(sessionUser);
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
    const sessionUser = data.session?.user || null;
    applySession(sessionUser);
    if (sessionUser) {
      await syncProfile(sessionUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || user?.role || 'user',
        isAdmin: (profile?.role || user?.role) === 'admin',
        refreshProfile: () => user?.id ? syncProfile({ id: user.id, email: user.email, user_metadata: { full_name: user.full_name, username: user.username, avatar_url: user.avatar_url } }) : Promise.resolve(),
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
