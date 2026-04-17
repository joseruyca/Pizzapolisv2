import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8578]" />
      <Input
        {...props}
        className="h-13 rounded-2xl border-black/10 bg-white pl-11 pr-4 text-[#141414] placeholder:text-[#9c9385] focus-visible:ring-[#efbf3a]"
      />
    </div>
  );
}

export default function AuthPage() {
  const { signIn, signUp, isAuthenticated, isLoadingAuth, authError, isSupabaseConfigured } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  if (isLoadingAuth) {
    return <div className="grid min-h-screen place-items-center bg-[#f4efe6]"><Loader2 className="h-8 w-8 animate-spin text-[#dbab23]" /></div>;
  }

  const nextUrl = searchParams.get('next') || '/home';
  if (isAuthenticated) return <Navigate to={nextUrl} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError('');
    setSuccess('');
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp({ email, password, fullName });
        setSuccess('Cuenta creada. Revisa tu email y confirma tu cuenta para entrar automáticamente.');
      }
    } catch (error) {
      setLocalError(error.message || 'No se pudo completar la autenticación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#141414]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-8 md:flex-row md:items-center md:justify-center">
        <div className="w-full max-w-md md:max-w-lg">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-[#d8ebd4] bg-[#eef7ec] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f7a35]">
            Explora sin cuenta · entra para participar
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#efbf3a] text-2xl shadow-[0_18px_38px_rgba(239,191,58,0.24)]">🍕</div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Pizzapolis</h1>
              <p className="mt-1 text-[#6d665b]">Mapa social de slices y planes.</p>
            </div>
          </div>
          <h2 className="mt-8 text-[2.8rem] font-black leading-[0.95] tracking-[-0.05em]">
            Descubre spots.
            <br />
            Únete a planes.
            <br />
            Habla con gente.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-[#5f584e]">
            El mapa es público. Crea cuenta solo para añadir spots, deslizar planes, entrar en grupos y usar tu perfil.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-black/8 bg-[#fffaf2] p-4">
              <div className="text-sm font-bold">Mapa público</div>
              <div className="mt-1 text-sm leading-6 text-[#6d665b]">Mira spots y compara precio del slice sin registrarte.</div>
            </div>
            <div className="rounded-[24px] border border-black/8 bg-[#fffaf2] p-4">
              <div className="text-sm font-bold">Función social real</div>
              <div className="mt-1 text-sm leading-6 text-[#6d665b]">Entra para crear planes, unirte y usar grupos y perfil.</div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-[32px] border border-black/8 bg-[#fffaf2] p-5 shadow-[0_24px_60px_rgba(39,29,14,0.12)]">
          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-2xl border border-[#f0cdc7] bg-[#fff0ec] p-4 text-sm text-[#b84234]">
              Falta configurar Supabase. Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
            </div>
          )}

          <div className="mb-5 flex rounded-2xl bg-[#f0e8db] p-1">
            <button type="button" onClick={() => setMode('signin')} className={`h-11 flex-1 rounded-xl text-sm font-semibold transition ${mode === 'signin' ? 'bg-white text-[#141414] shadow-sm' : 'text-[#7d7467]'}`}>
              Entrar
            </button>
            <button type="button" onClick={() => setMode('signup')} className={`h-11 flex-1 rounded-xl text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-[#141414] shadow-sm' : 'text-[#7d7467]'}`}>
              Crear cuenta
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && <Field icon={User} placeholder="Nombre visible" value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
            <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field icon={Lock} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {(localError || authError?.message) && <div className="rounded-2xl border border-[#f0cdc7] bg-[#fff0ec] p-3 text-sm text-[#b84234]">{localError || authError?.message}</div>}
            {success && <div className="rounded-2xl border border-[#d8ebd4] bg-[#eef7ec] p-3 text-sm text-[#2f7a35]">{success}</div>}

            <Button disabled={submitting || !isSupabaseConfigured} className="h-13 w-full rounded-2xl border-0 bg-[#efbf3a] text-base font-bold text-[#141414] hover:bg-[#dbab23]">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <Link to="/home" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-[#141414] hover:bg-[#fffdf8]">
            Seguir como visitante
          </Link>
        </div>
      </div>
    </div>
  );
}
