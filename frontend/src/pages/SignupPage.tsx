import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import {
  GraduationCap, Eye, EyeOff, ArrowLeft, Check,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageSelect } from '@/components/layout/LanguageSelect'

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

// ── SignupPage ────────────────────────────────────────────────────────────────

export function SignupPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [nationality, setNationality] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password || !confirmPw) {
      setError(t('auth.fillRequired'))
      return
    }
    if (password !== confirmPw) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (!agreed) {
      setError(t('auth.agreeTerms'))
      return
    }

    setSubmitting(true)
    // Stub: sign-up not yet wired to backend
    setTimeout(() => {
      setSubmitting(false)
      setError(t('auth.signupUnsupported'))
    }, 800)
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
        style={{ maxWidth: 390, borderRadius: 40, boxShadow: '0 24px 80px rgba(30,58,138,0.18)' }}
      >
        {/* Status bar spacer */}
        <div className="h-11 flex-shrink-0" />

        <div className="px-6 flex items-center justify-end flex-shrink-0">
          <LanguageSelect />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-3 flex-shrink-0">
          <Link
            to="/login"
            className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
            aria-label={t('auth.backToLogin')}
          >
            <ArrowLeft className="w-4 h-4 text-[#334155]" />
          </Link>
          <div>
            <h1 className="text-[20px] font-bold text-[#0F172A] leading-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#2563EB]" strokeWidth={2} />
              {t('auth.signupTitle')}
            </h1>
            <p className="text-[13px] text-[#64748B] leading-snug">{t('auth.signupSubtitle')}</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="px-5 pb-6 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] p-6 space-y-4"
          >
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#1E3A8A]">{t('auth.nameLabel')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.namePlaceholder')}
                className={inputCls}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#1E3A8A]">{t('auth.emailLabel')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className={inputCls}
                autoComplete="email"
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
                  autoComplete="new-password"
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

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#1E3A8A]">{t('auth.confirmPasswordLabel')}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className={`${inputCls} pr-12`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showConfirm ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Nationality */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#1E3A8A]">{t('auth.nationalityLabel')}</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder={t('auth.nationalityPlaceholder')}
                className={inputCls}
              />
            </div>

            {/* Terms */}
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              className="flex items-start gap-3 w-full text-left"
            >
              <span
                className={`mt-0.5 w-4 h-4 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  agreed ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#CBD5E1]'
                }`}
              >
                {agreed && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </span>
              <span className="text-[12px] text-[#64748B] leading-relaxed">{t('auth.termsLine')}</span>
            </button>

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
              className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
              }}
            >
              {submitting ? t('auth.creatingAccount') : t('auth.createAccount')}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
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

            {/* Back to login */}
            <p className="text-center text-[13px] text-[#64748B]">
              {t('auth.alreadyHave')}{' '}
              <Link to="/login" className="text-[#2563EB] font-semibold hover:text-[#1E3A8A] transition-colors">
                {t('auth.login')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
