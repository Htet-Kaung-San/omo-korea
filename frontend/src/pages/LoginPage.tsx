import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import pnuSeal from '@/assets/pnu-seal.svg'

// ── LoginPage ─────────────────────────────────────────────────────────────────

// Non-admin demo fixture, seeded by `npm run seed:test-fixtures`. Deliberately
// not a real student's account and deliberately not an admin, because this repo
// is public. Filled in only when the reviewer clicks the demo button.
const DEMO_STUDENT_ID = "202612345"
const DEMO_PASSWORD = "password"

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()

  const [studentId, setStudentId] = useState(
    () => localStorage.getItem("hey_pnu_remembered_student_id") || ""
  )
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(() =>
    Boolean(localStorage.getItem("hey_pnu_remembered_student_id"))
  )
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
      if (rememberMe) {
        localStorage.setItem("hey_pnu_remembered_student_id", studentId.trim());
      } else {
        localStorage.removeItem("hey_pnu_remembered_student_id");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'))
    } finally {
      setSubmitting(false)
    }
  }



  

  const inputCls =
    'w-full px-4 py-3 rounded-[14px] border border-pnu-border bg-pnu-surface text-pnu-text placeholder:text-[#94A3B8] text-[15px] outline-none focus:ring-2 focus:ring-pnu-blue-light/30 focus:border-pnu-blue-light transition-all'

  return (
    <div className="min-h-screen bg-[#E8EEF5] flex items-center justify-center p-4">
      {/* Mobile frame */}
      <div
        className="relative bg-pnu-surface w-full flex flex-col overflow-hidden"
        style={{ maxWidth: 390, minHeight: 700, borderRadius: 40, boxShadow: '0 24px 80px rgba(0,61,130,0.18)' }}
      >
        {/* Status bar spacer */}
        <div className="h-11 flex-shrink-0" />



        {/* Brand */}
        <div className="flex flex-col items-center pt-6 pb-8 px-6">
          <img
            src={pnuSeal}
            alt="Pusan National University"
            className="mb-5 h-20 w-20 object-contain"
          />
          <h1 className="text-[26px] font-bold tracking-tight text-pnu-blue leading-none mb-2">Hey! PNU</h1>
          <p className="text-[14px] text-pnu-muted text-center leading-snug max-w-[220px]">{t('auth.tagline')}</p>
        </div>

        {/* Card */}
        <div className="flex-1 px-5">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4"
          >
            {/* Student ID */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-pnu-blue">{t('auth.studentIdLabel')}</label>
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
              <label className="block text-[13px] font-semibold text-pnu-blue">{t('auth.passwordLabel')}</label>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-pnu-muted transition-colors"
                  aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[12px] font-semibold text-pnu-muted hover:text-pnu-blue transition-all">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-[5px] border-pnu-border text-pnu-blue focus:ring-pnu-blue/20"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-[12px] font-semibold text-pnu-blue hover:text-pnu-blue-light transition-colors"
              >
                Forgot Password?
              </Link>
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
              className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2 bg-gradient-to-br from-pnu-blue to-pnu-blue-light shadow-lg shadow-blue-900/25"
            >
              {submitting ? t('auth.loggingIn') : t('auth.login')}
            </button>

            {/* Demo account — one-click access for reviewers */}
            <button
              type="button"
              onClick={() => {
                setStudentId(DEMO_STUDENT_ID)
                setPassword(DEMO_PASSWORD)
                setError('')
              }}
              className="w-full py-2.5 rounded-[14px] font-semibold text-[13px] text-pnu-blue border border-pnu-border bg-pnu-surface hover:border-pnu-blue-light transition-all active:scale-[0.98]"
            >
              Use demo account
            </button>
          </form>

          {/* Sign Up Prompt */}
          <div className="mt-6 flex justify-center text-[13.5px]">
            <span className="text-pnu-muted mr-1.5">Don't have an account?</span>
            <Link
              to="/signup"
              className="font-bold text-pnu-blue hover:text-pnu-blue-light transition-colors"
            >
              Sign up
            </Link>
          </div>


        </div>
      </div>


    </div>
  )
}
