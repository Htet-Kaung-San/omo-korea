import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageSelect } from '@/components/layout/LanguageSelect'
import { api } from '@/api'
import pnuSeal from '@/assets/pnu-seal.png'

// ── LoginPage ─────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()

  // Pre-fill student ID when Remember Me was used previously
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

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStudentId, setForgotStudentId] = useState("")
  const [forgotError, setForgotError] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState("")
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotStep, setForgotStep] = useState<1 | 2>(1)
  const [forgotCode, setForgotCode] = useState("")
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false)

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

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setForgotError("")
    setForgotSuccess("")

    if (!forgotStudentId.trim()) {
      setForgotError("Please enter your student ID.")
      return
    }

    setForgotSubmitting(true)
    try {
      // Stub api.forgotPassword here or call it if it exists
      // We will assume the UI-frontend backend endpoint still works or will be implemented
      const res = await api.forgotPassword(forgotStudentId.trim())
      setForgotSuccess(
        `A password reset code has been sent to your email:\n${res.maskedEmail}`
      )
      setForgotStep(2)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Failed to search student ID.")
    } finally {
      setForgotSubmitting(false)
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault()
    setForgotError("")
    setForgotSuccess("")

    if (!forgotCode.trim() || !forgotNewPassword.trim()) {
      setForgotError("Please enter the verification code and your new password.")
      return
    }

    setForgotSubmitting(true)
    try {
      await api.resetPassword(forgotStudentId.trim(), forgotCode.trim(), forgotNewPassword.trim())
      setForgotSuccess("Your password has been successfully reset! You can now log in.")
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotCode("")
        setForgotNewPassword("")
        setForgotStudentId("")
        setForgotSuccess("")
      }, 3000)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Failed to reset password.")
    } finally {
      setForgotSubmitting(false)
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

        <div className="px-6 flex items-center justify-end flex-shrink-0">
          <LanguageSelect />
        </div>

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
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true)
                  setForgotStudentId("")
                  setForgotError("")
                  setForgotSuccess("")
                  setForgotStep(1)
                }}
                className="text-[12px] font-semibold text-pnu-blue hover:text-pnu-blue-light transition-colors"
              >
                Forgot Password?
              </button>
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
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[340px] shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotSubmit}>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Reset Password
                </h3>
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                  Enter your Student ID, and we'll send a reset code to your registered email address.
                </p>

                <div className="space-y-1.5 mb-5">
                  <label className="block text-[13px] font-semibold text-slate-700">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={forgotStudentId}
                    onChange={(e) => setForgotStudentId(e.target.value)}
                    placeholder="e.g. 202455474"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                {forgotError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mb-4">
                    {forgotError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-[14px] text-white bg-pnu-blue hover:bg-pnu-blue-light disabled:opacity-60 transition-colors"
                >
                  {forgotSubmitting ? "Searching..." : "Send Reset Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit}>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Check Your Email
                </h3>
                <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl mb-5 whitespace-pre-wrap leading-relaxed">
                  {forgotSuccess}
                </p>

                <div className="space-y-4 mb-5">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      placeholder="6-digit code"
                      className={inputCls}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={`${inputCls} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showForgotNewPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {forgotError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mb-4">
                    {forgotError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-[14px] text-white bg-pnu-blue hover:bg-pnu-blue-light disabled:opacity-60 transition-colors"
                >
                  {forgotSubmitting ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
