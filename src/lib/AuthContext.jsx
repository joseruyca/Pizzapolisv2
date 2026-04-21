import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'pizzapolis_current_user';

function getFallbackProfile(user) {
  const emailName = user?.email?.split('@')[0] || 'usuario';
  return {
    id: user?.id,
    email: user?.email || '',
    username:
      user?.user_metadata?.username ||
      user?.user_metadata?.full_name ||
      emailName,
    avatar_url: user?.user_metadata?.avatar_url || '',
    role: 'user',
  };
}

function normalizeResolvedProfile(profile, fallbackUser = null) {
  const fallback = fallbackUser ? getFallbackProfile(fallbackUser) : null;
  const emailName = fallbackUser?.email?.split('@')[0] || '';
  const username = profile?.username;
  const shouldPromoteFullName = Boolean(
    fallback?.username &&
    username &&
    emailName &&
    username.toLowerCase() === emailName.toLowerCase() &&
    fallback.username.toLowerCase() !== emailName.toLowerCase(),
  );

  return {
    ...(fallback || {}),
    ...(profile || {}),
    username: shouldPromoteFullName ? fallback.username : (profile?.username || fallback?.username || emailName || 'usuario'),
  };
}

function bridgeUser(user, profile) {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }

  const resolvedProfile = profile || getFallbackProfile(user);
  const displayName =
    user.user_metadata?.full_name ||
    resolvedProfile.username ||
    user.email ||
    'Usuario';

  const bridged = {
    id: user.id,
    email: user.email,
    full_name: displayName,
    username:
      resolvedProfile.username || user.email?.split('@')[0] || 'user',
    role: resolvedProfile.role || 'user',
    avatar_url: resolvedProfile.avatar_url || '',
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(bridged));
  return bridged;
}

async function fetchProfileByUserId(userId, fallbackUser = null) {
  if (!supabase || !userId) {
    return fallbackUser ? getFallbackProfile(fallbackUser) : null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,username,avatar_url,role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Profile select failed:', error.message || error);
    return fallbackUser ? getFallbackProfile(fallbackUser) : null;
  }

  if (!data) {
    return fallbackUser ? getFallbackProfile(fallbackUser) : null;
  }

  return normalizeResolvedProfile(data, fallbackUser);
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
  const profileRequestRef = useRef(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    if (!mountedRef.current) return;

    setSessionUser(null);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setIsProfileReady(true);
  }, []);

  const applyResolvedUser = useCallback(
    (nextSessionUser, resolvedProfile) => {
      if (!mountedRef.current) return;

      if (!nextSessionUser) {
        clearSession();
        return;
      }

      const safeProfile = resolvedProfile || getFallbackProfile(nextSessionUser);

      setSessionUser(nextSessionUser);
      setProfile(safeProfile);
      setUser(bridgeUser(nextSessionUser, safeProfile));
      setIsAuthenticated(true);
      setIsProfileReady(true);
    },
    [clearSession],
  );

  const resolveProfile = useCallback(
    async (nextSessionUser) => {
      if (!nextSessionUser?.id) return null;
      if (profileRequestRef.current === nextSessionUser.id) return null;

      profileRequestRef.current = nextSessionUser.id;
      if (mountedRef.current) setIsProfileReady(false);

      try {
        const resolved = await fetchProfileByUserId(nextSessionUser.id, nextSessionUser);
        if (!mountedRef.current) return resolved;
        applyResolvedUser(nextSessionUser, resolved);
        return resolved;
      } finally {
        profileRequestRef.current = null;
      }
    },
    [applyResolvedUser],
  );

  const refreshProfile = useCallback(async () => {
    if (!sessionUser?.id) return null;
    return await resolveProfile(sessionUser);
  }, [sessionUser, resolveProfile]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isSupabaseConfigured) {
      setAuthError({
        type: 'config_missing',
        message: 'Supabase no está configurado.',
      });
      setIsProfileReady(true);
      setIsLoadingAuth(false);
      return () => {
        mountedRef.current = false;
      };
    }

    let unsubscribe = null;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const nextSessionUser = data?.session?.user || null;

        if (!nextSessionUser) {
          clearSession();
          return;
        }

        setSessionUser(nextSessionUser);
        setUser(bridgeUser(nextSessionUser, getFallbackProfile(nextSessionUser)));
        setIsAuthenticated(true);

        await resolveProfile(nextSessionUser);
      } catch (error) {
        console.error('Session restore error:', error);
        clearSession();
        setAuthError({
          type: 'session_error',
          message: error.message || 'No se pudo restaurar la sesión.',
        });
      } finally {
        if (mountedRef.current) {
          setIsLoadingAuth(false);
        }
      }
    };

    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextSessionUser = session?.user || null;

      if (!nextSessionUser) {
        clearSession();
        setIsLoadingAuth(false);
        return;
      }

      setSessionUser(nextSessionUser);
      setUser(bridgeUser(nextSessionUser, getFallbackProfile(nextSessionUser)));
      setIsAuthenticated(true);
      setIsLoadingAuth(false);

      void resolveProfile(nextSessionUser);
    });

    unsubscribe = listener?.subscription?.unsubscribe;

    return () => {
      mountedRef.current = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [clearSession, resolveProfile]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase no está configurado.');

    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const nextSessionUser = data?.user || data?.session?.user || null;

    if (nextSessionUser) {
      setSessionUser(nextSessionUser);
      setUser(bridgeUser(nextSessionUser, getFallbackProfile(nextSessionUser)));
      setIsAuthenticated(true);
      await resolveProfile(nextSessionUser);
    }

    setIsLoadingAuth(false);
    return data;
  };

  const signUp = async ({ email, password, fullName }) => {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const cleanName = String(fullName || '').trim();
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl.replace(/\/$/, '')}/auth/confirm`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: cleanName, username: cleanName },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) throw error;

    if (data?.user?.id && cleanName) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          email,
          username: cleanName,
          avatar_url: data.user.user_metadata?.avatar_url || '',
        },
        { onConflict: 'id' },
      );
      if (profileError) {
        console.warn('Profile upsert warning:', profileError.message || profileError);
      }
    }

    return data;
  };

  const signInWithProvider = async (provider) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl.replace(/\/$/, '')}/auth/confirm`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const cleanEmail = String(email || '').trim();
    if (!cleanEmail) throw new Error('Escribe tu email primero.');
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl.replace(/\/$/, '')}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
    if (error) throw error;
    return true;
  };

  const logout = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout warning:', error?.message || error);
    } finally {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/home';
      }
    }
  };

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  };

  const checkAppState = async () => {
    if (!supabase) {
      clearSession();
      return;
    }

    const { data } = await supabase.auth.getSession();
    const nextSessionUser = data?.session?.user || null;

    if (!nextSessionUser) {
      clearSession();
      return;
    }

    setSessionUser(nextSessionUser);
    setUser(bridgeUser(nextSessionUser, getFallbackProfile(nextSessionUser)));
    setIsAuthenticated(true);
    await resolveProfile(nextSessionUser);
  };

  const contextValue = useMemo(
    () => ({
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
      signInWithProvider,
      resetPassword,
      isSupabaseConfigured,
    }),
    [
      user,
      profile,
      refreshProfile,
      isAuthenticated,
      isLoadingAuth,
      isProfileReady,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
