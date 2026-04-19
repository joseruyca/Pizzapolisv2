import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
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
    role: 'user',
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
    role: resolvedProfile.role || 'user',
    avatar_url: resolvedProfile.avatar_url || '',
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(bridged));
  return bridged;
}

async function fetchProfile(userId, fallbackUser = null) {
  if (!supabase || !userId) return fallbackUser ? getFallbackProfile(fallbackUser) : null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,username,avatar_url,role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Profile select failed:', error.message || error);
    return fallbackUser ? getFallbackProfile(fallbackUser) : null;
  }

  if (!data) return fallbackUser ? getFallbackProfile(fallbackUser) : null;

  return {
    ...(fallbackUser ? getFallbackProfile(fallbackUser) : {}),
    ...data,
  };
}

export const AuthProvider = ({ children }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ localMode: false });
  const mountedRef = useRef(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    if (!mountedRef.current) return;
    setSessionUser(null);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setIsProfileReady(true);
  }, []);

  const applySessionUser = useCallback((nextSessionUser) => {
    if (!mountedRef.current) return;
    setSessionUser(nextSessionUser || null);
    if (!nextSessionUser) {
      clearSession();
      return;
    }
    const fallback = getFallbackProfile(nextSessionUser);
    setUser(bridgeUser(nextSessionUser, fallback));
    setProfile((prev) => ({ ...fallback, ...(prev || {}) }));
    setIsAuthenticated(true);
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured || !sessionUser?.id) return null;
    if (mountedRef.current) setIsProfileReady(false);
    const resolved = await fetchProfile(sessionUser.id, sessionUser);
    if (!mountedRef.current || !resolved) return resolved;
    setProfile(resolved);
    setUser(bridgeUser(sessionUser, resolved));
    setIsAuthenticated(true);
    setIsProfileReady(true);
    return resolved;
  }, [sessionUser]);

  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      if (!isSupabaseConfigured) {
        setAuthError({ type: 'config_missing', message: 'Supabase no está configurado.' });
        setIsProfileReady(true);
        setIsLoadingAuth(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const nextSessionUser = data.session?.user || null;
        applySessionUser(nextSessionUser);
        if (nextSessionUser) {
          await refreshProfile();
        } else if (mountedRef.current) {
          setIsProfileReady(true);
        }
      } catch (error) {
        console.error('Session restore error:', error);
        clearSession();
        setAuthError({ type: 'session_error', message: error.message || 'No se pudo restaurar la sesión.' });
      } finally {
        if (mountedRef.current) setIsLoadingAuth(false);
      }
    }

    init();

    const { data: listener } = isSupabaseConfigured
      ? supabase.auth.onAuthStateChange((_event, session) => {
          const nextSessionUser = session?.user || null;
          applySessionUser(nextSessionUser);
          setIsLoadingAuth(false);
          if (nextSessionUser) {
            if (mountedRef.current) setIsProfileReady(false);
            setTimeout(() => {
              void fetchProfile(nextSessionUser.id, nextSessionUser).then((resolved) => {
                if (!mountedRef.current || !resolved) return;
                setProfile(resolved);
                setUser(bridgeUser(nextSessionUser, resolved));
                setIsAuthenticated(true);
                setIsProfileReady(true);
              });
            }, 0);
          } else if (mountedRef.current) {
            setIsProfileReady(true);
          }
        })
      : { data: { subscription: { unsubscribe() {} } } };

    return () => {
      mountedRef.current = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [applySessionUser, clearSession, refreshProfile]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const nextSessionUser = data?.user || data?.session?.user || null;
    applySessionUser(nextSessionUser);
    if (nextSessionUser) {
      if (mountedRef.current) setIsProfileReady(false);
      const resolved = await fetchProfile(nextSessionUser.id, nextSessionUser);
      if (mountedRef.current && resolved) {
        setProfile(resolved);
        setUser(bridgeUser(nextSessionUser, resolved));
      }
      if (mountedRef.current) setIsProfileReady(true);
    }
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
      options: { data: { full_name: fullName }, emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout warning:', error?.message || error);
    } finally {
      clearSession();
      if (typeof window !== 'undefined') window.location.href = '/home';
    }
  };

  const navigateToLogin = () => { if (typeof window !== 'undefined') window.location.href = '/auth'; };

  const checkAppState = async () => {
    if (!supabase) {
      clearSession();
      return;
    }
    const { data } = await supabase.auth.getSession();
    const nextSessionUser = data.session?.user || null;
    applySessionUser(nextSessionUser);
    if (nextSessionUser) {
      await refreshProfile();
    } else if (mountedRef.current) {
      setIsProfileReady(true);
    }
  };

  const contextValue = useMemo(() => ({
    user,
    profile,
    role: profile?.role || user?.role || 'user',
    isAdmin: (profile?.role || user?.role) === 'admin',
    refreshProfile,
    isAuthenticated,
    isLoadingAuth,
    isProfileReady,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    logout,
    navigateToLogin,
    checkAppState,
    signIn,
    signUp,
    isSupabaseConfigured,
  }), [user, profile, refreshProfile, isAuthenticated, isLoadingAuth, isProfileReady, isLoadingPublicSettings, authError, appPublicSettings]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
