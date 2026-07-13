import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageSelect } from '@/components/layout/LanguageSelect'
import { DEMO_PASSWORD } from '@/api'

// ── Google icon ───────────────────────────────────────────────────────────────

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

// ── LoginPage ─────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()

  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#EEF2F7]">
        <p className="text-sm text-pnu-muted">{t('common.loading')}</p>
      </div>
    )
  }

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!studentId.trim() || !password) {
      setError(t('auth.loginRequired'))
      return
    }
    setSubmitting(true)
    try {
      await login({ studentId: studentId.trim(), password })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-4 py-3 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8] text-[15px] outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all'

  return (
    <div
      className="min-h-screen bg-[#E8EEF5] flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Mobile frame */}
      <div
        className="relative bg-[#F8FAFC] w-full flex flex-col overflow-hidden"
        style={{ maxWidth: 390, minHeight: 700, borderRadius: 40, boxShadow: '0 24px 80px rgba(30,58,138,0.18)' }}
      >
        {/* Status bar spacer */}
        <div className="h-11 flex-shrink-0" />

        <div className="px-6 flex items-center justify-end flex-shrink-0">
          <LanguageSelect />
        </div>

        {/* Brand */}
        <div className="flex flex-col items-center pt-8 pb-8 px-6">
          <div
            className="w-20 h-20 rounded-[22px] flex items-center justify-center mb-5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}
          >
            <GraduationCap className="w-10 h-10 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A] leading-none mb-2">Hey! PNU</h1>
          <p className="text-[14px] text-[#64748B] text-center leading-snug max-w-[220px]">{t('auth.tagline')}</p>
        </div>

        {/* Card */}
        <div className="flex-1 px-5">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] p-6 space-y-4"
          >
            {/* Student ID */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#1E3A8A]">{t('auth.studentIdLabel')}</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder={t('auth.studentIdPlaceholder')}
                className={inputCls}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#1E3A8A]">{t('auth.passwordLabel')}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={`${inputCls} pr-12`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
              }}
            >
              {submitting ? t('auth.loggingIn') : t('auth.login')}
            </button>

            {/* Forgot / Sign-up links */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button type="button" className="text-[13px] text-[#64748B] hover:text-[#1E3A8A] transition-colors">
                {t('auth.forgot')}
              </button>
              <span className="w-px h-3.5 bg-[#E2E8F0]" aria-hidden="true" />
              <Link
                to="/signup"
                className="text-[13px] text-[#2563EB] font-semibold hover:text-[#1E3A8A] transition-colors"
              >
                {t('auth.signup')}
              </Link>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-[12px] text-[#94A3B8] font-medium whitespace-nowrap">{t('auth.orContinue')}</span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-[14px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all text-[13px] font-semibold text-[#334155]"
            >
              <GoogleMark />
              <span>Google</span>
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-4 mb-6 rounded-xl border border-dashed border-[#CBD5E1] bg-white/60 px-4 py-3 text-xs leading-relaxed text-[#64748B] space-y-1">
            <p className="font-semibold text-[#0F172A]">
              {t('auth.demoCredentials', { password: DEMO_PASSWORD })}
            </p>
            <p>
              • {t('auth.demoFreshman')}:{' '}
              <span className="font-semibold text-[#0F172A]">{`${currentYear}12345`}</span>
              {' '}({t('home.newStudentChecklist')})
            </p>
            <p>
              • {t('auth.demoNonFreshman')}:{' '}
              <span className="font-semibold text-[#0F172A]">202012345</span>
              {' '}({t('home.graduationChecklist')})
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
