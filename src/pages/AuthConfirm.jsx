import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function getHashParams() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  return new URLSearchParams(hash);
}

export default function AuthConfirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/home';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Confirming your email and starting your session…');

  const tokenHash = useMemo(() => searchParams.get('token_hash') || getHashParams().get('token_hash'), [searchParams]);
  const type = useMemo(() => searchParams.get('type') || getHashParams().get('type') || 'email', [searchParams]);
  const hasAuthTokens = useMemo(() => {
    const hashParams = getHashParams();
    return Boolean(hashParams.get('access_token') || hashParams.get('refresh_token'));
  }, []);

  useEffect(() => {
    let active = true;

    async function confirm() {
      try {
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        }

        if (hasAuthTokens) {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        if (!active) return;
        setStatus('success');
        setMessage('Email confirmed. Redirecting you back into Pizzapolis…');
        window.setTimeout(() => navigate(next, { replace: true }), 900);
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setMessage(error?.message || 'We could not confirm your email. Please request a new link.');
      }
    }

    confirm();

    return () => {
      active = false;
    };
  }, [tokenHash, type, hasAuthTokens, navigate, next]);

  return (
    <div className="min-h-screen bg-[#080808] text-white grid place-items-center px-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#111] p-6 shadow-2xl shadow-black/40">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl">🍕</div>
        <h1 className="text-3xl font-black">Pizzapolis</h1>
        <p className="mt-2 text-stone-400">Email confirmation</p>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-6 text-center">
          {status === 'loading' && <Loader2 className="mx-auto h-10 w-10 animate-spin text-red-500" />}
          {status === 'success' && <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />}
          {status === 'error' && <XCircle className="mx-auto h-10 w-10 text-red-400" />}
          <p className="mt-5 text-sm leading-7 text-stone-300">{message}</p>
        </div>

        <div className="mt-6 grid gap-3">
          <Link to="/auth" className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white hover:bg-red-500">Go to login</Link>
          <Link to="/home" className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-stone-200 hover:bg-white/[0.05]">Continue as guest</Link>
        </div>
      </div>
    </div>
  );
}
