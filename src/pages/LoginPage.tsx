import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { DEMO_PASSWORD } from '@/api'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-pnu-surface">
        <p className="text-sm text-pnu-muted">Loading…</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!studentId.trim() || !password) {
      setError('Please enter your student ID and password.')
      return
    }

    setSubmitting(true)
    try {
      await login({ studentId: studentId.trim(), password })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-pnu-surface">
      <div className="flex flex-col items-center px-6 pb-8 pt-12">
        <div
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}
        >
          <GraduationCap className="h-10 w-10 text-white" strokeWidth={1.75} />
        </div>
        <h1 className="text-[28px] font-bold leading-none tracking-tight text-pnu-text">Hey! PNU</h1>
        <p className="mt-2 max-w-[240px] text-center text-sm leading-snug text-pnu-muted">
          Your PNU life, simplified.
        </p>
      </div>

      <div className="flex-1 px-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-pnu-border bg-white p-5 shadow-sm"
        >
          <Input
            label="학번 (Student ID)"
            placeholder="Enter your student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            autoComplete="username"
          />

          <div className="mt-4">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-pnu-muted hover:text-pnu-text"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" fullWidth className="mt-5" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <div className="mt-4 rounded-xl border border-dashed border-pnu-border bg-white/60 px-4 py-3 text-xs leading-relaxed text-pnu-muted space-y-1">
          <p className="font-semibold text-pnu-text">Demo Credentials (Password: {DEMO_PASSWORD})</p>
          <p>• Freshman: <span className="font-semibold text-pnu-text">202612345</span> (New Student Checklist)</p>
          <p>• Non-freshman: <span className="font-semibold text-pnu-text">202012345</span> (Graduation Checklist)</p>
        </div>
      </div>
    </div>
  )
}
