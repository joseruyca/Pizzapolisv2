import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock, Mail, User, ArrowRight, Facebook, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

function Field({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8578]" />
      <Input
        {...props}
        className={`h-12 rounded-2xl border-[#dad1c4] bg-white pl-11 pr-4 text-[#111111] placeholder:text-[#aea493] focus-visible:ring-[#6f74ff] ${className}`}
      />
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2H12Z" />
      <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.5-2.4l-3.1-2.4c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1l-3.2 2.5C4.9 19.8 8.2 22 12 22Z" />
      <path fill="#4A90E2" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.2 7.5C2.4 8.9 2 10.4 2 12s.4 3.1 1.2 4.5L6.4 14Z" />
      <path fill="#FBBC05" d="M12 5.9c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 2.9 14.6 2 12 2 8.2 2 4.9 4.2 3.2 7.5L6.4 10c.8-2.3 3-4.1 5.6-4.1Z" />
    </svg>
  );
}

function SocialButton({ icon, children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#e1d7ca] bg-white text-sm font-semibold text-[#111111] transition hover:bg-[#faf7f1] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {children}
    </button>
  );
}

export default function AuthPage() {
  const { signIn, signUp, signInWithOAuth, resetPassword, isAuthenticated, isLoadingAuth, authError, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  if (isLoadingAuth) return <div className="grid min-h-screen place-items-center bg-[#f4efe6]"><Loader2 className="h-8 w-8 animate-spin text-[#111111]" /></div>;

  const nextUrl = searchParams.get('next') || '/home';
  if (isAuthenticated) return <Navigate to={nextUrl} replace />;

  const submitLabel = useMemo(() => (mode === 'signin' ? 'Login' : 'Crear cuenta'), [mode]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError('');
    setSuccess('');

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (!result?.user && !result?.session) throw new Error('No se pudo iniciar sesión.');
        if (!rememberMe) {
          sessionStorage.setItem('pizzapolis_session_hint', 'session_only');
        }
        window.location.replace(nextUrl);
        return;
      }

      await signUp({ email, password, fullName });
      setSuccess('Cuenta creada. Revisa tu email y confirma tu cuenta para entrar.');
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
      await resetPassword(email);
      setSuccess('Te hemos enviado un email para restablecer la contraseña.');
    } catch (error) {
      setLocalError(error?.message || 'No se pudo enviar el email de recuperación.');
    }
  };

  const handleOAuth = async (provider) => {
    setLocalError('');
    setSuccess('');
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider, nextUrl);
    } catch (error) {
      setLocalError(error?.message || 'No se pudo iniciar sesión con ese proveedor.');
      setOauthLoading('');
    }
  };

  return (
    <div className="auth-screen grid min-h-screen place-items-center bg-[#f4efe6] px-4 py-4 text-[#111111]">
      <div className="mx-auto w-full max-w-[420px] rounded-[34px] border border-black/8 bg-[#fffaf1] p-5 shadow-[0_24px_60px_rgba(34,25,11,0.12)] md:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0bf39] text-2xl shadow-[0_18px_36px_rgba(240,191,57,0.24)]">🍕</div>
          <div>
            <div className="text-[1.95rem] font-black leading-none tracking-[-0.04em]">Pizzapolis</div>
            <div className="mt-1 text-sm text-[#6f6555]">Cuenta para spots, planes y grupos.</div>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">
            Falta configurar Supabase. Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          </div>
        )}

        <div className="mb-5 flex rounded-2xl bg-[#e9dece] p-1">
          <button type="button" onClick={() => setMode('signup')} className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#8b7f6c]'}`}>Crear cuenta</button>
          <button type="button" onClick={() => setMode('signin')} className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signin' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#8b7f6c]'}`}>Entrar</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'signup' && <Field icon={User} placeholder="Nombre visible" value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
          <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field icon={Lock} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {mode === 'signin' && (
            <div className="flex items-center justify-between gap-3 px-1 text-[13px] text-[#8d8477]">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-[#d0c6b8] text-[#6f74ff] focus:ring-[#6f74ff]" />
                <span>Remember me</span>
              </label>
              <button type="button" onClick={handleForgotPassword} className="font-medium text-[#8d8477] transition hover:text-[#111111]">
                Forgot Password?
              </button>
            </div>
          )}

          {(localError || authError?.message) && <div className="rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">{localError || authError?.message}</div>}
          {success && <div className="rounded-2xl border border-[#cfe3d1] bg-[#eef7ec] p-3 text-sm text-[#216b33]">{success}</div>}

          <Button disabled={submitting || !isSupabaseConfigured} className="h-12 w-full rounded-2xl border-0 bg-[#6f74ff] text-base font-bold text-white hover:bg-[#5f63ef]">
            {(submitting || oauthLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-[#a19687]">
          <div className="h-px flex-1 bg-[#e5dccf]" />
          <span>or sign up with</span>
          <div className="h-px flex-1 bg-[#e5dccf]" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SocialButton icon={<Facebook className="h-4 w-4" />} onClick={() => handleOAuth('facebook')} disabled={!isSupabaseConfigured || Boolean(oauthLoading)}>Facebook</SocialButton>
          <SocialButton icon={<GoogleGlyph />} onClick={() => handleOAuth('google')} disabled={!isSupabaseConfigured || Boolean(oauthLoading)}>Google</SocialButton>
          <SocialButton icon={<Apple className="h-4 w-4" />} onClick={() => handleOAuth('apple')} disabled={!isSupabaseConfigured || Boolean(oauthLoading)}>Apple</SocialButton>
        </div>

        <Link to="/home" className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#dfd6c9] bg-[#f9f7f2] text-sm font-semibold text-[#111111] transition hover:bg-white">
          Seguir como visitante
        </Link>
      </div>
    </div>
  );
}
