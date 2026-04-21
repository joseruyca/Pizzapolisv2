import React, { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/AuthContext';

const EMAIL_STORAGE_KEY = 'pizzapolis_auth_email';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b836f]" />
      <Input
        {...props}
        className="h-12 rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-[#111111] placeholder:text-[#9b9283] shadow-none focus-visible:ring-2 focus-visible:ring-[#6d6cf7]/35"
      />
    </div>
  );
}

function ProviderButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-[#111111] transition hover:bg-[#fbfaf7] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export default function AuthPage() {
  const {
    signIn,
    signUp,
    signInWithProvider,
    resetPassword,
    isAuthenticated,
    isLoadingAuth,
    authError,
    isSupabaseConfigured,
  } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (saved) setEmail(saved);
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4efe6]">
        <Loader2 className="h-8 w-8 animate-spin text-[#111111]" />
      </div>
    );
  }

  const nextUrl = searchParams.get('next') || '/home';
  if (isAuthenticated) return <Navigate to={nextUrl} replace />;

  const persistRememberChoice = () => {
    if (rememberMe) localStorage.setItem(EMAIL_STORAGE_KEY, email.trim());
    else localStorage.removeItem(EMAIL_STORAGE_KEY);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError('');
    setSuccess('');

    try {
      if (mode === 'signin') {
        const result = await signIn(email.trim(), password);
        if (!result?.user && !result?.session) throw new Error('No se pudo iniciar sesión.');
        persistRememberChoice();
        window.location.replace(nextUrl);
        return;
      }

      await signUp({ email: email.trim(), password, fullName: username.trim() });
      persistRememberChoice();
      setSuccess('Cuenta creada. Revisa tu email para confirmar la cuenta.');
      setMode('signin');
    } catch (error) {
      setLocalError(error?.message || 'No se pudo completar la autenticación.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setLocalError('');
    setSuccess('');
    try {
      await resetPassword(email.trim());
      setSuccess('Te hemos enviado el email para resetear la contraseña.');
    } catch (error) {
      setLocalError(error?.message || 'No se pudo enviar el email de recuperación.');
    }
  };

  const handleProvider = async (provider) => {
    setLocalError('');
    setSuccess('');
    try {
      await signInWithProvider(provider);
    } catch (error) {
      setLocalError(error?.message || 'No se pudo iniciar con ese proveedor.');
    }
  };

  return (
    <div className="auth-screen grid min-h-screen place-items-center bg-[#f4efe6] px-4 py-6 text-[#111111]">
      <div className="w-full max-w-[380px] rounded-[34px] border border-black/10 bg-[#fffaf1] p-5 shadow-[0_28px_70px_rgba(34,25,11,0.12)] md:p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0bf39] text-2xl shadow-[0_18px_36px_rgba(240,191,57,0.22)]">🍕</div>
          <div>
            <div className="text-[2rem] font-black leading-none tracking-[-0.05em]">Pizzapolis</div>
            <div className="mt-1 text-sm text-[#6e6558]">Cuenta para spots, planes y grupos.</div>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">
            Falta configurar Supabase. Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          </div>
        )}

        <div className="mb-5 flex rounded-2xl bg-[#eee3d2] p-1">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#857b6b]'}`}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signin' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#857b6b]'}`}
          >
            Entrar
          </button>
        </div>

        <div className="mb-5">
          <h1 className="text-[2rem] font-black leading-[0.95] tracking-[-0.05em] text-[#111111]">
            {mode === 'signin' ? 'Login to your account.' : 'Create your account.'}
          </h1>
          <p className="mt-2 text-sm text-[#9a9182]">
            {mode === 'signin' ? 'Hello, welcome back to your account.' : 'Create it once and start joining real plans.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'signup' && (
            <Field
              icon={User}
              placeholder="Nombre visible"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <Field
            icon={Mail}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Field
            icon={Lock}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between gap-3 px-1 pt-1 text-xs text-[#8d8577]">
            <label className="inline-flex items-center gap-2">
              <Checkbox checked={rememberMe} onCheckedChange={(value) => setRememberMe(Boolean(value))} />
              <span>Remember me</span>
            </label>
            <button type="button" onClick={handleForgotPassword} className="font-medium text-[#8d8577] hover:text-[#111111]">
              Forgot Password?
            </button>
          </div>

          {(localError || authError?.message) && (
            <div className="rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">
              {localError || authError?.message}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-[#d7e6d1] bg-[#eef7ec] p-3 text-sm text-[#216b33]">
              {success}
            </div>
          )}

          <Button
            disabled={submitting || !isSupabaseConfigured}
            className="h-12 w-full rounded-2xl border-0 bg-[#6d6cf7] text-base font-bold text-white hover:bg-[#5f5eee]"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'signin' ? 'Login' : 'Create account'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-[#9a9182]">
          <div className="h-px flex-1 bg-black/10" />
          <span>or sign up with</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ProviderButton onClick={() => handleProvider('facebook')} disabled={!isSupabaseConfigured}>Facebook</ProviderButton>
          <ProviderButton onClick={() => handleProvider('google')} disabled={!isSupabaseConfigured}>Google</ProviderButton>
          <ProviderButton onClick={() => handleProvider('apple')} disabled={!isSupabaseConfigured}>Apple</ProviderButton>
        </div>

        <Link
          to="/home"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-[#111111] hover:bg-[#fbfaf7]"
        >
          Seguir como visitante
        </Link>
      </div>
    </div>
  );
}
