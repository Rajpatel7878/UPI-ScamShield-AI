import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { BrandLogo } from '../components/common/BrandLogo.jsx'
import { Button, InputField } from '../components/ui/index.js'
import { useAuth } from '../context/AppContext.jsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register'
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const destination = location.state?.from?.pathname || '/dashboard'

  if (isAuthenticated) {
    return <Navigate to={destination} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const cleanEmail = email.trim()
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (isRegister && !fullName.trim()) {
      setError('Enter your full name.')
      return
    }

    setIsSubmitting(true)
    try {
      if (isRegister) {
        await register({ fullName: fullName.trim(), email: cleanEmail, password })
      } else {
        await login(cleanEmail, password)
      }
      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError?.message || 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex justify-center">
        <BrandLogo size="md" />
      </div>

      <div className="rounded-card border border-white/10 bg-navy-800 p-6 shadow-card sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <h1 className="type-h1">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="type-body mt-2 text-muted">
            {isRegister
              ? 'Save scan history and track your security insights.'
              : 'Sign in to run analyses and review your history.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {isRegister && (
            <InputField
              label="Full name"
              id="auth-full-name"
              icon={UserRound}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              maxLength={100}
              required
            />
          )}

          <InputField
            label="Email address"
            id="auth-email"
            icon={Mail}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            maxLength={255}
            required
          />

          <div>
            <label htmlFor="auth-password" className="type-field-label">
              Password
            </label>
            <div className="relative mt-1.5">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={8}
                maxLength={128}
                required
                aria-describedby={isRegister ? 'password-hint' : undefined}
                className="h-10 w-full rounded-lg border border-white/10 bg-navy-950/60 px-9 text-sm text-ink outline-none transition-colors focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {isRegister && (
              <p id="password-hint" className="type-caption mt-1.5">
                Use at least 8 characters. Never reuse your bank or UPI password.
              </p>
            )}
          </div>

          <div aria-live="polite" role="status">
            {error && (
              <p className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
                {error}
              </p>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} loadingText="Please wait">
            {isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="type-caption mt-5 text-center">
          {isRegister ? 'Already have an account?' : 'New to ScamShield?'}{' '}
          <Link
            to={isRegister ? '/login' : '/register'}
            state={location.state}
            className="font-medium text-brand-300 underline-offset-4 hover:underline"
          >
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>

      <p className="type-caption mt-4 text-center">
        Submitted messages are analyzed for risk and are not stored. When AI
        assistance is enabled, message text is sent to a configured AI provider
        (OpenRouter or Google Gemini) after OTP, PIN, and password values are masked.
      </p>
    </div>
  )
}
