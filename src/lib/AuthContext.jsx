import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const AuthContext = createContext();

function getFallbackProfile(user) {
  return {
    id: user?.id || null,
    email: user?.email || "",
    username:
      String(user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split?.("@")[0] || "")
        .trim() || "Usuario",
    avatar_url: user?.user_metadata?.avatar_url || "",
    role: "user",
  };
}

function normalizeProfile(profile, sessionUser = null) {
  const fallback = sessionUser ? getFallbackProfile(sessionUser) : null;
  const merged = { ...(fallback || {}), ...(profile || {}) };
  return {
    ...merged,
    username: String(merged.username || "").trim() || "Usuario",
    role: merged.role || "user",
  };
}

async function fetchProfileByUserId(userId, sessionUser = null) {
  if (!supabase || !userId) return sessionUser ? getFallbackProfile(sessionUser) : null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,username,avatar_url,role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Profile select failed:", error.message || error);
    return sessionUser ? getFallbackProfile(sessionUser) : null;
  }

  return normalizeProfile(data, sessionUser);
}

export const AuthProvider = ({ children }) => {
  const [sessionUser, setSessionUser] = useState(null);
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
    if (!mountedRef.current) return;
    setSessionUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setIsProfileReady(true);
  }, []);

  const applyResolvedProfile = useCallback((nextSessionUser, nextProfile) => {
    if (!mountedRef.current) return;
    if (!nextSessionUser) {
      clearSession();
      return;
    }
    setSessionUser(nextSessionUser);
    setProfile(normalizeProfile(nextProfile, nextSessionUser));
    setIsAuthenticated(true);
    setIsProfileReady(true);
  }, [clearSession]);

  const resolveProfile = useCallback(async (nextSessionUser) => {
    if (!nextSessionUser?.id) return null;
    if (profileRequestRef.current === nextSessionUser.id) return null;

    profileRequestRef.current = nextSessionUser.id;
    if (mountedRef.current) setIsProfileReady(false);

    try {
      const resolved = await fetchProfileByUserId(nextSessionUser.id, nextSessionUser);
      applyResolvedProfile(nextSessionUser, resolved);
      return resolved;
    } finally {
      profileRequestRef.current = null;
    }
  }, [applyResolvedProfile]);

  const refreshProfile = useCallback(async () => {
    if (!sessionUser?.id) return null;
    return resolveProfile(sessionUser);
  }, [resolveProfile, sessionUser]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isSupabaseConfigured) {
      setAuthError({ type: "config_missing", message: "Supabase no está configurado." });
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
        setProfile(getFallbackProfile(nextSessionUser));
        setIsAuthenticated(true);
        await resolveProfile(nextSessionUser);
      } catch (error) {
        console.error("Session restore error:", error);
        clearSession();
        setAuthError({ type: "session_error", message: error.message || "No se pudo restaurar la sesión." });
      } finally {
        if (mountedRef.current) setIsLoadingAuth(false);
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
      setProfile(getFallbackProfile(nextSessionUser));
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      void resolveProfile(nextSessionUser);
    });

    unsubscribe = listener?.subscription?.unsubscribe;

    return () => {
      mountedRef.current = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [clearSession, resolveProfile]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error("Supabase no está configurado.");
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const nextSessionUser = data?.user || data?.session?.user || null;
    if (nextSessionUser) {
      setSessionUser(nextSessionUser);
      setProfile(getFallbackProfile(nextSessionUser));
      setIsAuthenticated(true);
      await resolveProfile(nextSessionUser);
    }

    setIsLoadingAuth(false);
    return data;
  };

  const signUp = async ({ email, password, fullName }) => {
    if (!supabase) throw new Error("Supabase no está configurado.");

    const cleanName = String(fullName || "").trim();
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl.replace(/\/$/, "")}/auth/confirm`;

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
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email,
          username: cleanName,
          avatar_url: data.user.user_metadata?.avatar_url || "",
        },
        { onConflict: "id" },
      );
      if (profileError) console.warn("Profile upsert warning:", profileError.message || profileError);
    }

    return data;
  };

  const signInWithProvider = async (provider) => {
    if (!supabase) throw new Error("Supabase no está configurado.");
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl.replace(/\/$/, "")}/auth/confirm`;
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email) => {
    if (!supabase) throw new Error("Supabase no está configurado.");
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) throw new Error("Escribe tu email primero.");
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectTo = `${baseUrl.replace(/\/$/, "")}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
    if (error) throw error;
    return true;
  };

  const logout = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (error) {
      console.warn("Logout warning:", error?.message || error);
    } finally {
      clearSession();
      if (typeof window !== "undefined") window.location.assign("/home");
    }
  };

  const navigateToLogin = () => {
    if (typeof window !== "undefined") window.location.assign("/auth");
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
    setProfile(getFallbackProfile(nextSessionUser));
    setIsAuthenticated(true);
    await resolveProfile(nextSessionUser);
  };

  const user = useMemo(() => {
    if (!sessionUser && !profile) return null;
    const resolved = normalizeProfile(profile, sessionUser);
    return {
      id: resolved.id,
      email: resolved.email,
      full_name: resolved.username,
      username: resolved.username,
      role: resolved.role,
      avatar_url: resolved.avatar_url,
    };
  }, [profile, sessionUser]);

  const contextValue = useMemo(() => ({
    user,
    sessionUser,
    profile,
    role: profile?.role || user?.role || "user",
    isAdmin: (profile?.role || user?.role) === "admin",
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
  }), [
    user,
    sessionUser,
    profile,
    refreshProfile,
    isAuthenticated,
    isLoadingAuth,
    isProfileReady,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
