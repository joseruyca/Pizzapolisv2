import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
      <Input {...props} className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-11 text-white placeholder:text-stone-500" />
    </div>
  );
}

export default function AuthPage() {
  const { isAuthenticated, signIn, signUp, isSupabaseConfigured, authError, isLoadingAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  if (isLoadingAuth) {
    return <div className="min-h-screen grid place-items-center bg-[#080808]"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>;
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
        setSuccess('Cuenta creada. Revisa tu email y confirma tu cuenta para continuar. Después volverás a Pizzapolis automáticamente.');
      }
    } catch (error) {
      setLocalError(error.message || 'No se pudo completar la autenticación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl">🍕</div>
          <h1 className="text-4xl font-black">Pizzapolis</h1>
          <p className="mt-2 text-stone-400">Puedes explorar el mapa sin cuenta. Entra para añadir spots, unirte a planes y chatear.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            Falta configurar Supabase. Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en tu entorno.
          </div>
        )}

        <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <button type="button" onClick={() => setMode('signin')} className={`h-11 flex-1 rounded-xl text-sm font-semibold ${mode === 'signin' ? 'bg-red-600 text-white' : 'text-stone-400'}`}>Entrar</button>
          <button type="button" onClick={() => setMode('signup')} className={`h-11 flex-1 rounded-xl text-sm font-semibold ${mode === 'signup' ? 'bg-red-600 text-white' : 'text-stone-400'}`}>Crear cuenta</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.02] p-5 shadow-2xl shadow-black/30">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">
            <span className="font-semibold text-white">Explora libremente:</span> el mapa y los spots son públicos.
          </div>
          {mode === 'signup' && <Field icon={User} placeholder="Nombre visible" value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
          <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field icon={Lock} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {(localError || authError?.message) && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{localError || authError?.message}</div>}
          {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</div>}

          <Button disabled={submitting || !isSupabaseConfigured} className="h-12 w-full rounded-2xl bg-red-600 text-base font-bold hover:bg-red-500">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </Button>
        </form>

        <Link to="/home" className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-stone-200 hover:bg-white/[0.05]">Seguir como visitante</Link>
      </div>
    </div>
  );
}
