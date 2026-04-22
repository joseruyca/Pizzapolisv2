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
      <Input {...props} className="h-12 rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-[#111] placeholder:text-[#9b9283]" />
    </div>
  );
}

export default function AuthPage() {
  const { signIn, signUp, resetPassword, isAuthenticated, isLoadingAuth, authError, isSupabaseConfigured } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { const saved = localStorage.getItem(EMAIL_STORAGE_KEY); if (saved) setEmail(saved); }, []);
  if (isLoadingAuth) return <div className="grid min-h-screen place-items-center bg-[#f4efe6]"><Loader2 className="h-8 w-8 animate-spin text-[#111]" /></div>;
  const nextUrl = searchParams.get('next') || '/home';
  if (isAuthenticated) return <Navigate to={nextUrl} replace />;

  const persistRememberChoice = () => {
    if (rememberMe) localStorage.setItem(EMAIL_STORAGE_KEY, email.trim());
    else localStorage.removeItem(EMAIL_STORAGE_KEY);
  };

  const onSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setLocalError(''); setSuccess('');
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        persistRememberChoice();
        window.location.replace(nextUrl); return;
      }
      if (!username.trim()) throw new Error('Choose a public username first.');
      await signUp({ email: email.trim(), password, fullName: username.trim() });
      persistRememberChoice();
      setSuccess('Account created. Check your inbox to confirm your email.');
      setMode('signin');
    } catch (error) { setLocalError(error?.message || 'Could not complete authentication.'); }
    finally { setSubmitting(false); }
  };

  const handleForgotPassword = async () => {
    setLocalError(''); setSuccess('');
    try { await resetPassword(email.trim()); setSuccess('Password reset email sent.'); }
    catch (error) { setLocalError(error?.message || 'Could not send the recovery email.'); }
  };

  return (
    <div className="auth-screen grid min-h-screen place-items-center bg-[#f4efe6] px-4 py-6 text-[#111]">
      <div className="w-full max-w-[380px] rounded-[34px] border border-black/10 bg-[#fffaf1] p-5 shadow-[0_28px_70px_rgba(34,25,11,0.12)] md:p-6">
        <div className="mb-6 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0bf39] text-2xl">🍕</div><div><div className="text-[2rem] font-black leading-none tracking-[-0.05em]">Pizzapolis</div><div className="mt-1 text-sm text-[#6e6558]">Simple access: username public, email private.</div></div></div>
        {!isSupabaseConfigured && <div className="mb-4 rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">Supabase is missing. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</div>}
        <div className="mb-5 flex rounded-2xl bg-[#eee3d2] p-1">
          <button type="button" onClick={() => setMode('signup')} className={`h-11 flex-1 rounded-xl text-sm font-bold ${mode === 'signup' ? 'bg-white text-[#111] shadow-sm' : 'text-[#857b6b]'}`}>Create account</button>
          <button type="button" onClick={() => setMode('signin')} className={`h-11 flex-1 rounded-xl text-sm font-bold ${mode === 'signin' ? 'bg-white text-[#111] shadow-sm' : 'text-[#857b6b]'}`}>Login</button>
        </div>
        <div className="mb-5"><h1 className="text-[2rem] font-black leading-[0.95] tracking-[-0.05em]">{mode === 'signin' ? 'Login to your account.' : 'Create your account.'}</h1><p className="mt-2 text-sm text-[#9a9182]">{mode === 'signin' ? 'Welcome back.' : 'Your email stays private. Your username is public.'}</p></div>
        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'signup' && <Field icon={User} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />}
          <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="flex items-center justify-between gap-3 px-1 pt-1 text-xs text-[#8d8577]"><label className="inline-flex items-center gap-2"><Checkbox checked={rememberMe} onCheckedChange={(value) => setRememberMe(Boolean(value))} /><span>Remember me</span></label><button type="button" onClick={handleForgotPassword} className="font-medium hover:text-[#111]">Forgot password?</button></div>
          {(localError || authError?.message) && <div className="rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">{localError || authError?.message}</div>}
          {success && <div className="rounded-2xl border border-[#d7e6d1] bg-[#eef7ec] p-3 text-sm text-[#216b33]">{success}</div>}
          <Button disabled={submitting || !isSupabaseConfigured} className="h-12 w-full rounded-2xl border-0 bg-[#6d6cf7] text-base font-bold text-white hover:bg-[#5f5eee]">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{mode === 'signin' ? 'Login' : 'Create account'}<ArrowRight className="ml-2 h-4 w-4" /></Button>
        </form>
        <Link to="/home" className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-[#111] hover:bg-[#fbfaf7]">Continue as guest</Link>
      </div>
    </div>
  );
}
