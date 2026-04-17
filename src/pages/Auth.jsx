import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock, Mail, User, ArrowRight, MapPin, Users, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f584e]" />
      <Input {...props} className="h-12 rounded-2xl border-black/12 bg-white pl-11 pr-4 text-[#111111] placeholder:text-[#998f80] focus-visible:ring-[#f0bf39]" />
    </div>
  );
}

const bullets = [
  { icon: MapPin, text: 'Mapa público con spots y precios reales.' },
  { icon: Flame, text: 'Descubrir con swipe para planes rápidos.' },
  { icon: Users, text: 'Crear planes, unirte y entrar en grupos.' },
];

export default function AuthPage() {
  const { signIn, signUp, isAuthenticated, isLoadingAuth, authError, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  if (isLoadingAuth) return <div className="grid min-h-screen place-items-center bg-[#f4efe6]"><Loader2 className="h-8 w-8 animate-spin text-[#111111]" /></div>;

  const nextUrl = searchParams.get('next') || '/home';
  if (isAuthenticated) return <Navigate to={nextUrl} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError('');
    setSuccess('');
    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (!result?.user && !result?.session) {
          throw new Error('No se pudo iniciar sesión.');
        }
        window.location.replace(nextUrl);
        return;
      } else {
        await signUp({ email, password, fullName });
        setSuccess('Cuenta creada. Revisa tu email y confirma tu cuenta para entrar.');
      }
    } catch (error) {
      setLocalError(error?.message || 'No se pudo completar la autenticación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f4efe6] px-4 py-4 text-[#111111] md:grid md:place-items-center">
      <div className="mx-auto w-full max-w-md rounded-[34px] border border-black/10 bg-[#fffaf1] p-5 shadow-[0_24px_60px_rgba(34,25,11,0.12)] md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0bf39] text-2xl shadow-[0_18px_36px_rgba(240,191,57,0.24)]">🍕</div>
          <div>
            <div className="text-[1.9rem] font-black leading-none tracking-[-0.04em]">Pizzapolis</div>
            <div className="mt-1 text-sm text-[#5d5548]">Cuenta para spots, planes y grupos.</div>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">
            Falta configurar Supabase. Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          </div>
        )}

        <div className="mb-4 flex rounded-2xl bg-[#efe4d3] p-1">
          <button type="button" onClick={() => setMode('signup')} className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#7d7467]'}`}>Crear cuenta</button>
          <button type="button" onClick={() => setMode('signin')} className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signin' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#7d7467]'}`}>Entrar</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'signup' && <Field icon={User} placeholder="Nombre visible" value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
          <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field icon={Lock} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {(localError || authError?.message) && <div className="rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">{localError || authError?.message}</div>}
          {success && <div className="rounded-2xl border border-[#cfe3d1] bg-[#eef7ec] p-3 text-sm text-[#216b33]">{success}</div>}

          <Button disabled={submitting || !isSupabaseConfigured} className="h-12 w-full rounded-2xl border-0 bg-[#f0bf39] text-base font-black text-[#111111] hover:bg-[#d9a826]">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="mt-4 grid gap-2">
          {bullets.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 rounded-[20px] border border-black/8 bg-[#f8f3ea] px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#111111] text-[#f0bf39]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium text-[#111111]">{text}</div>
            </div>
          ))}
        </div>

        <Link to="/home" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-[#111111] hover:bg-[#fffdf8]">
          Seguir como visitante
        </Link>
      </div>
    </div>
  );
}
