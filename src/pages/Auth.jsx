import React, { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Mail, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/lib/AuthContext'
import { authModes, signInSchema, signUpSchema } from '@/lib/validators/auth'

const EMAIL_STORAGE_KEY = 'pizzapolis_auth_email'

function Field({ icon: Icon, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b836f]" />
        <Input
          {...props}
          className={`h-12 rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-[#111] placeholder:text-[#9b9283] ${className}`}
        />
      </div>
      {error ? <p className="px-1 text-xs text-[#b54834]">{error}</p> : null}
    </div>
  )
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
  } = useAuth()

  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(authModes.SIGN_IN)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const resolver = useMemo(
    () => zodResolver(mode === authModes.SIGN_UP ? signUpSchema : signInSchema),
    [mode],
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {
      email: '',
      password: '',
      username: '',
      rememberMe: true,
    },
  })

  const email = watch('email')
  const rememberMe = watch('rememberMe')
  const nextUrl = searchParams.get('next') || '/home'

  useEffect(() => {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY)
    if (saved) setValue('email', saved)
  }, [setValue])

  useEffect(() => {
    setSuccessMessage('')
    reset(
      (currentValues) => ({
        ...currentValues,
        password: '',
        username: mode === authModes.SIGN_UP ? currentValues.username : '',
      }),
      { keepValues: true, keepDirty: false, keepErrors: false },
    )
  }, [mode, reset])

  if (isLoadingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4efe6]">
        <Loader2 className="h-8 w-8 animate-spin text-[#111]" />
      </div>
    )
  }

  if (isAuthenticated) return <Navigate to={nextUrl} replace />

  const persistRememberChoice = () => {
    if (rememberMe) localStorage.setItem(EMAIL_STORAGE_KEY, String(email || '').trim())
    else localStorage.removeItem(EMAIL_STORAGE_KEY)
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    setSuccessMessage('')

    try {
      if (mode === authModes.SIGN_IN) {
        await signIn(values.email.trim(), values.password)
        persistRememberChoice()
        toast.success('Welcome back to Pizzapolis')
        window.location.replace(nextUrl)
        return
      }

      await signUp({
        email: values.email.trim(),
        password: values.password,
        fullName: values.username.trim(),
      })
      persistRememberChoice()
      setSuccessMessage('Account created. Check your inbox to confirm your email.')
      toast.success('Account created. Confirm your email to continue.')
      setMode(authModes.SIGN_IN)
    } catch (error) {
      toast.error(error?.message || 'Could not complete authentication.')
    } finally {
      setSubmitting(false)
    }
  })

  const handleForgotPassword = async () => {
    setSuccessMessage('')
    try {
      await resetPassword(String(email || '').trim())
      setSuccessMessage('Password reset email sent.')
      toast.success('Password reset email sent.')
    } catch (error) {
      toast.error(error?.message || 'Could not send the recovery email.')
    }
  }

  const handleGoogleSignIn = async () => {
    setSubmitting(true)
    try {
      await signInWithProvider('google')
    } catch (error) {
      toast.error(error?.message || 'Could not continue with Google.')
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen grid min-h-screen place-items-center bg-[#f4efe6] px-4 py-6 text-[#111]">
      <div className="w-full max-w-[420px] rounded-[34px] border border-black/10 bg-[#fffaf1] p-5 shadow-[0_28px_70px_rgba(34,25,11,0.12)] md:p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0bf39] text-2xl">🍕</div>
          <div>
            <div className="text-[2rem] font-black leading-none tracking-[-0.05em]">Pizzapolis</div>
            <div className="mt-1 text-sm text-[#6e6558]">Explore the map as a guest. Sign in to join plans, chat and create your own.</div>
          </div>
        </div>

        {!isSupabaseConfigured ? (
          <div className="mb-4 rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">
            Supabase is missing. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          </div>
        ) : null}

        <div className="mb-5 flex rounded-2xl bg-[#eee3d2] p-1">
          <button
            type="button"
            onClick={() => setMode(authModes.SIGN_UP)}
            className={`h-11 flex-1 rounded-xl text-sm font-bold ${mode === authModes.SIGN_UP ? 'bg-white text-[#111] shadow-sm' : 'text-[#857b6b]'}`}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => setMode(authModes.SIGN_IN)}
            className={`h-11 flex-1 rounded-xl text-sm font-bold ${mode === authModes.SIGN_IN ? 'bg-white text-[#111] shadow-sm' : 'text-[#857b6b]'}`}
          >
            Login
          </button>
        </div>

        <div className="mb-5">
          <h1 className="text-[2rem] font-black leading-[0.95] tracking-[-0.05em]">
            {mode === authModes.SIGN_IN ? 'Login to your account.' : 'Create your account.'}
          </h1>
          <p className="mt-2 text-sm text-[#9a9182]">
            {mode === authModes.SIGN_IN ? 'Welcome back.' : 'Your email stays private. Your username is public.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === authModes.SIGN_UP ? (
            <Field
              icon={User}
              placeholder="Username"
              autoComplete="nickname"
              error={errors.username?.message}
              {...register('username')}
            />
          ) : null}

          <Field
            icon={Mail}
            type="email"
            placeholder="Email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Field
            icon={Lock}
            type="password"
            placeholder="Password"
            autoComplete={mode === authModes.SIGN_IN ? 'current-password' : 'new-password'}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between gap-3 px-1 pt-1 text-xs text-[#8d8577]">
            <label className="inline-flex items-center gap-2">
              <Checkbox checked={rememberMe} onCheckedChange={(value) => setValue('rememberMe', Boolean(value))} />
              <span>Remember me</span>
            </label>
            <button type="button" onClick={handleForgotPassword} className="font-medium hover:text-[#111]">
              Forgot password?
            </button>
          </div>

          {authError?.message ? (
            <div className="rounded-2xl border border-[#efc5bc] bg-[#fff0ea] p-3 text-sm text-[#b54834]">{authError.message}</div>
          ) : null}
          {successMessage ? (
            <div className="rounded-2xl border border-[#d7e6d1] bg-[#eef7ec] p-3 text-sm text-[#216b33]">{successMessage}</div>
          ) : null}

          <Button disabled={submitting || !isSupabaseConfigured} className="h-12 w-full rounded-2xl border-0 bg-[#6d6cf7] text-base font-bold text-white hover:bg-[#5f5eee]">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === authModes.SIGN_IN ? 'Login' : 'Create account'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#9a9182]">
          <div className="h-px flex-1 bg-black/10" />
          <span>or</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={submitting || !isSupabaseConfigured}
          onClick={handleGoogleSignIn}
          className="h-12 w-full rounded-2xl border-black/10 bg-white text-sm font-semibold text-[#111] hover:bg-[#fbfaf7]"
        >
          Continue with Google
        </Button>

        <Link
          to="/home"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-[#f9f4eb] text-sm font-semibold text-[#111] hover:bg-[#fbfaf7]"
        >
          Continue as guest
        </Link>
      </div>
    </div>
  )
}
