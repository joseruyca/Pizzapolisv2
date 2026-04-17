import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function getHashParams() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  return new URLSearchParams(hash);
}

function friendlyMessage(raw) {
  if (!raw) return 'No pudimos confirmar tu email. Pide un enlace nuevo e inténtalo otra vez.';
  const text = String(raw);
  if (text.includes('expired')) return 'Este enlace ha caducado. Pide uno nuevo desde la pantalla de acceso.';
  if (text.includes('otp_expired')) return 'Este enlace ha caducado. Pide uno nuevo desde la pantalla de acceso.';
  if (text.includes('invalid')) return 'Este enlace no es válido o ya fue usado. Pide uno nuevo e inténtalo otra vez.';
  if (text.includes('stole it') || text.includes('released because another request stole it')) {
    return 'Este enlace ya fue procesado en otra comprobación. Vamos a intentar entrar igualmente.';
  }
  return text;
}

export default function AuthConfirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/home';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Confirmando tu email y preparando tu acceso…');

  useEffect(() => {
    let active = true;

    async function run() {
      if (!supabase) {
        if (!active) return;
        setStatus('error');
        setMessage('Supabase no está configurado en esta build.');
        return;
      }

      const hashParams = getHashParams();
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
      const type = searchParams.get('type') || hashParams.get('type') || 'email';
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const urlError = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error');

      try {
        if (urlError) {
          throw new Error(urlError);
        }

        const existing = await supabase.auth.getSession();
        if (existing?.data?.session?.user) {
          if (!active) return;
          setStatus('success');
          setMessage('Tu email ya estaba confirmado. Entrando en Pizzapolis…');
          window.history.replaceState({}, document.title, '/auth/confirm');
          window.setTimeout(() => navigate(next, { replace: true }), 700);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
        } else {
          throw new Error('Faltan datos de confirmación en el enlace.');
        }

        if (!active) return;
        setStatus('success');
        setMessage('Email confirmado correctamente. Entrando en Pizzapolis…');
        window.history.replaceState({}, document.title, '/auth/confirm');
        window.setTimeout(() => navigate(next, { replace: true }), 700);
      } catch (error) {
        const msg = friendlyMessage(error?.message || error);

        if (msg.includes('Vamos a intentar entrar igualmente.')) {
          try {
            const retry = await supabase.auth.getSession();
            if (retry?.data?.session?.user) {
              if (!active) return;
              setStatus('success');
              setMessage('Tu email ya quedó confirmado. Entrando en Pizzapolis…');
              window.history.replaceState({}, document.title, '/auth/confirm');
              window.setTimeout(() => navigate(next, { replace: true }), 700);
              return;
            }
          } catch {}
        }

        if (!active) return;
        setStatus('error');
        setMessage(msg);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [navigate, next, searchParams]);

  return (
    <div className="min-h-screen bg-[#080808] text-white grid place-items-center px-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#111] p-6 shadow-2xl shadow-black/40">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl">🍕</div>
        <h1 className="text-3xl font-black">Pizzapolis</h1>
        <p className="mt-2 text-stone-400">Confirmación de email</p>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-6 text-center">
          {status === 'loading' && <Loader2 className="mx-auto h-10 w-10 animate-spin text-red-500" />}
          {status === 'success' && <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />}
          {status === 'error' && <XCircle className="mx-auto h-10 w-10 text-red-400" />}
          <p className="mt-5 text-sm leading-7 text-stone-300">{message}</p>
        </div>

        <div className="mt-6 grid gap-3">
          <Link to="/auth" className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white hover:bg-red-500">Ir al acceso</Link>
          <Link to="/home" className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-stone-200 hover:bg-white/[0.05]">Seguir como visitante</Link>
        </div>
      </div>
    </div>
  );
}
