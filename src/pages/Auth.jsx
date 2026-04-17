import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock, Mail, User, ArrowRight, MapPin, Users, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f675a]" />
      <Input {...props} className="h-12 rounded-2xl border-black/12 bg-white pl-11 pr-4 text-[#111111] placeholder:text-[#9a8f7d] focus-visible:ring-[#f0bf39]" />
    </div>
  );
}

const bullets = [
  { icon: MapPin, text: 'Mapa público con spots y precios reales.' },
  { icon: Flame, text: 'Descubrir con swipe para planes rápidos.' },
  { icon: Users, text: 'Cuenta solo para crear, unirte y hablar.' },
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
        await signIn(email, password);
        navigate(nextUrl, { replace: true });
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
      <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-[430px_minmax(0,1fr)]">
        <section className="order-2 rounded-[32px] border border-black/10 bg-[#fffaf1] p-5 shadow-[0_24px_60px_rgba(34,25,11,0.12)] md:order-1 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0bf39] text-2xl shadow-[0_18px_36px_rgba(240,191,57,0.24)]">🍕</div>
            <div>
              <div className="text-[1.9rem] font-black leading-none tracking-[-0.04em]">Pizzapolis</div>
              <div className="mt-1 text-sm text-[#5d5548]">Acceso social para spots y planes.</div>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">
              Falta configurar Supabase. Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
            </div>
          )}

          <div className="mb-4 flex rounded-2xl bg-[#efe4d3] p-1">
            <button type="button" onClick={() => setMode('signup')} className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signup' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#7d7467]'}`}>Crear cuenta</button>
            <button type="button" onClick={() => setMode('signin')} className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signin' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#7d7467]'}`}>Entrar</button>
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

          <Link to="/home" className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-[#111111] hover:bg-[#fffdf8]">
            Seguir como visitante
          </Link>
        </section>

        <section className="order-1 rounded-[32px] border border-black/10 bg-[#111111] p-5 text-white shadow-[0_26px_68px_rgba(17,17,17,0.18)] md:order-2 md:p-6">
          <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#f0bf39]">
            Explora sin cuenta · entra para participar
          </div>
          <h1 className="mt-4 text-[clamp(2.4rem,7vw,4rem)] font-black leading-[0.92] tracking-[-0.07em]">
            Primero creas cuenta.
            <br />
            Luego todo encaja.
          </h1>
          <p className="mt-4 max-w-[32rem] text-[15px] leading-7 text-white/78">
            El mapa sigue siendo público. Tu cuenta solo desbloquea crear plan, unirte con swipe, entrar a grupos y usar tu perfil.
          </p>

          <div className="mt-6 grid gap-3">
            {bullets.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0bf39] text-[#111111]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium text-white/88">{text}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
