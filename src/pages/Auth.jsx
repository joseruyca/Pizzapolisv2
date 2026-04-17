import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock, Mail, User, ArrowRight, CheckCircle2, MapPin, Users, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b816f]" />
      <Input
        {...props}
        className="h-12 rounded-2xl border-black/10 bg-white pl-11 pr-4 text-[#111111] placeholder:text-[#998f7d] focus-visible:ring-[#ebb932]"
      />
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

  if (isLoadingAuth) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f3eb]"><Loader2 className="h-8 w-8 animate-spin text-[#d6a11e]" /></div>;
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
        navigate(nextUrl, { replace: true });
      } else {
        await signUp({ email, password, fullName });
        setSuccess('Cuenta creada. Revisa tu email y confirma tu cuenta para entrar.');
      }
    } catch (error) {
      setLocalError(error.message || 'No se pudo completar la autenticación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#f7f3eb] text-[#111111]">
      <div className="mx-auto grid h-full max-w-5xl items-center gap-5 px-4 py-4 md:grid-cols-[420px_minmax(0,1fr)] md:px-6">
        <div className="order-1 rounded-[30px] border border-black/8 bg-[#fffaf1] p-5 shadow-[0_24px_60px_rgba(34,25,11,0.12)] md:p-6">
          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">
              Falta configurar Supabase. Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
            </div>
          )}

          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ebb932] text-2xl shadow-[0_18px_36px_rgba(235,185,50,0.24)]">🍕</div>
            <div>
              <div className="text-[1.9rem] font-black leading-none tracking-[-0.04em]">Pizzapolis</div>
              <div className="mt-1 text-sm text-[#605747]">Acceso social para spots y planes.</div>
            </div>
          </div>

          <div className="mb-4 flex rounded-2xl bg-[#efe5d6] p-1">
            <button type="button" onClick={() => setMode('signup')} className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#7d7467]'}`}>
              Crear cuenta
            </button>
            <button type="button" onClick={() => setMode('signin')} className={`h-11 flex-1 rounded-xl text-sm font-bold transition ${mode === 'signin' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#7d7467]'}`}>
              Entrar
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === 'signup' && <Field icon={User} placeholder="Nombre visible" value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
            <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field icon={Lock} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {(localError || authError?.message) && <div className="rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">{localError || authError?.message}</div>}
            {success && <div className="rounded-2xl border border-[#cfe3d1] bg-[#eef7ec] p-3 text-sm text-[#216b33]">{success}</div>}

            <Button disabled={submitting || !isSupabaseConfigured} className="h-12 w-full rounded-2xl border-0 bg-[#ebb932] text-base font-black text-[#111111] hover:bg-[#d6a11e]">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <Link to="/home" className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-semibold text-[#111111] hover:bg-[#fffdf8]">
            Seguir como visitante
          </Link>
        </div>

        <div className="order-2 min-h-0 rounded-[30px] border border-black/8 bg-[#fff9f0] p-5 shadow-[0_20px_50px_rgba(34,25,11,0.08)] md:p-6">
          <div className="inline-flex rounded-full border border-[#cfe3d1] bg-[#eef7ec] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#216b33]">
            Social solo cuando hace falta
          </div>
          <h1 className="mt-4 text-[clamp(2.35rem,7vw,4.3rem)] font-black leading-[0.92] tracking-[-0.06em]">
            Crea cuenta.
            <br />
            Entra.
            <br />
            Queda.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#605747]">
            El mapa es público. Tu cuenta desbloquea crear plan, unirte con swipe, entrar en grupos y usar tu perfil sin llenar la app de pasos extra.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {bullets.map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-[24px] border border-black/8 bg-white px-4 py-3.5">
                <div className="flex items-center gap-3 text-[#111111]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5efe1] text-[#216b33]"><Icon className="h-4 w-4" /></div>
                  <div className="text-sm font-semibold leading-6 text-[#605747]">{text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-[#cfe3d1] bg-[#f8fbf5] px-4 py-4 text-sm text-[#216b33]">
            <div className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" />Confirmación por email real</div>
            <div className="mt-1 leading-6">Cuando confirmes el email entras con el flujo nuevo limpio, sin pantalla rara y sin modo demo visible.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
