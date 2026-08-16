import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageSelect } from '@/components/layout/LanguageSelect'
import type { MajorData } from '@/types/api'
import pnuSeal from '@/assets/pnu-seal.svg'

// PR #23 hid the demo button outside mock mode so a working credential is never
// shown on a public deployment; this repo is public. The mock API is gone, so
// gate on the dev build instead — reviewers running locally keep the shortcut,
// a production build never renders it.
const SHOW_DEMO_ACCOUNT = import.meta.env.DEV

// Non-admin demo fixture, seeded by `npm run seed:test-fixtures`.
const DEMO_EMAIL = '202612345@pusan.ac.kr'
const DEMO_PASSWORD = 'password'
const REMEMBERED_EMAIL_KEY = 'hey_pnu_remembered_email'
const LEGACY_REMEMBERED_ID_KEY = 'hey_pnu_remembered_student_id'

function getRememberedEmail() {
  const email = localStorage.getItem(REMEMBERED_EMAIL_KEY)
  if (email) return email
  const legacyId = localStorage.getItem(LEGACY_REMEMBERED_ID_KEY)
  return legacyId ? `${legacyId}@pusan.ac.kr` : ''
}

export function LoginPage() {
  const { requestLogin, verifyLogin, refreshUser, user, isAuthenticated, isLoading } =
    useAuth()
  const { t } = useLanguage()

  const [email, setEmail] = useState(getRememberedEmail)
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() =>
    Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY) || localStorage.getItem(LEGACY_REMEMBERED_ID_KEY)),
  )
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [step, setStep] = useState<'credentials' | 'otp' | 'major' | 'year'>('credentials')
  const [challengeId, setChallengeId] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [majorsData, setMajorsData] = useState<MajorData[]>([])
  const [selectedCollege, setSelectedCollege] = useState('')
  const [selectedMajor, setSelectedMajor] = useState('')
  const [loadingMajors, setLoadingMajors] = useState(false)
  const [selectedYear, setSelectedYear] = useState<'' | '1' | '2' | '3' | '4' | 'exchange'>('')

  useEffect(() => {
    if (step === 'major') {
      setLoadingMajors(true)
      api.getMajors()
        .then(res => setMajorsData(res.data || []))
        .catch(err => console.error('Failed to load majors', err))
        .finally(() => setLoadingMajors(false))
    }
  }, [step])

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#EEF2F7]">
        <p className="text-sm text-pnu-muted">{t('common.loading')}</p>
      </div>
    )
  }

  // Stay on this page for major / year selection after OTP.
  if (isAuthenticated && step !== 'major' && step !== 'year') {
    return <Navigate to="/" replace />
  }
  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError(t('auth.loginRequired'))
      return
    }
    setSubmitting(true)
    try {
      const challenge = await requestLogin({
        email: email.trim().toLowerCase(),
        password,
      })
      setChallengeId(challenge.challengeId)
      setMaskedEmail(challenge.maskedEmail)
      setOtpCode('')
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!otpCode.trim()) {
      setError(t('auth.otpRequired'))
      return
    }
    setSubmitting(true)
    try {
      const loggedInUser = await verifyLogin({
        challengeId,
        code: otpCode.trim(),
      })
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim().toLowerCase())
        localStorage.removeItem(LEGACY_REMEMBERED_ID_KEY)
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
        localStorage.removeItem(LEGACY_REMEMBERED_ID_KEY)
      }
      setSelectedMajor('')
      setSelectedCollege('')
      // verifyLogin resolves to the signed-in user itself, so a student who
      // already picked a major skips straight to the year step.
      if (loggedInUser.major) {
        setStep('year')
      } else {
        setStep('major')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otpError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMajorSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedMajor) {
      setError(t('auth.majorRequired'))
      return
    }
    setSubmitting(true)
    try {
      await api.updateProfile({
        name: user?.name?.trim() || 'Student',
        nationality: user?.nationality || '',
        major: selectedMajor,
        interests: user?.interests ?? [],
      })
      await refreshUser()
      setSelectedYear('')
      setStep('year')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.majorError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleYearSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedYear) {
      setError(t('auth.yearRequired'))
      return
    }
    setSubmitting(true)
    try {
      await api.updateProfile({
        name: user?.name?.trim() || 'Student',
        nationality: user?.nationality || '',
        major: selectedMajor || user?.major || '',
        interests: user?.interests ?? [],
        year: selectedYear,
      })
      await refreshUser()
      setStep('credentials')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.yearError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendCode() {
    setError('')
    setSubmitting(true)
    try {
      const challenge = await requestLogin({
        email: email.trim().toLowerCase(),
        password,
      })
      setChallengeId(challenge.challengeId)
      setMaskedEmail(challenge.maskedEmail)
      setOtpCode('')
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
      <div
        className="relative bg-pnu-surface w-full flex flex-col overflow-hidden"
        style={{ maxWidth: 390, minHeight: 700, borderRadius: 40, boxShadow: '0 24px 80px rgba(0,61,130,0.18)' }}
      >
        <div className="flex h-11 flex-shrink-0 items-center justify-end px-4 pt-1">
          <LanguageSelect />
        </div>

        <div className="flex flex-col items-center pt-4 pb-6 px-6">
          <img
            src={pnuSeal}
            alt="Pusan National University"
            className="mb-5 h-20 w-20 object-contain"
          />
          <h1 className="text-[26px] font-bold tracking-tight text-pnu-blue leading-none mb-2">Hey! PNU</h1>
          <p className="text-[14px] text-pnu-muted text-center leading-snug max-w-[220px]">{t('auth.tagline')}</p>
        </div>

        <div className="flex-1 px-5 pb-6">
          {step === 'credentials' ? (
            <form
              onSubmit={handleCredentialsSubmit}
              className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-pnu-blue">{t('auth.emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={inputCls}
                  autoComplete="email"
                />
              </div>

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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[12px] font-semibold text-pnu-muted hover:text-pnu-blue transition-all">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-[5px] border-pnu-border text-pnu-blue focus:ring-pnu-blue/20"
                  />
                  {t('auth.rememberMe')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-semibold text-pnu-blue hover:text-pnu-blue-light transition-colors"
                >
                  {t('auth.forgot')}
                </Link>
              </div>

              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2 bg-gradient-to-br from-pnu-blue to-pnu-blue-light shadow-lg shadow-blue-900/25"
              >
                {submitting ? t('auth.loggingIn') : t('auth.continue')}
              </button>

              {SHOW_DEMO_ACCOUNT ? (
                <button
                  type="button"
                  onClick={() => {
                    setEmail(DEMO_EMAIL)
                    setPassword(DEMO_PASSWORD)
                    setError('')
                  }}
                  className="w-full py-2.5 rounded-[14px] font-semibold text-[13px] text-pnu-blue border border-pnu-border bg-pnu-surface hover:border-pnu-blue-light transition-all active:scale-[0.98]"
                >
                  {t('auth.useDemoAccount')}
                </button>
              ) : null}
            </form>
          ) : null}

          {step === 'otp' ? (
            <form
              onSubmit={handleOtpSubmit}
              className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4"
            >
              <div>
                <h2 className="text-[16px] font-bold text-pnu-text">{t('auth.otpTitle')}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-pnu-muted">
                  {t('auth.otpHint', { email: maskedEmail })}
                </p>
                {email.trim().toLowerCase() === DEMO_EMAIL ? (
                  <p className="mt-1 text-[12px] font-semibold text-pnu-blue">
                    {t('auth.otpDemoHint')}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-pnu-blue">{t('auth.otpLabel')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('auth.otpPlaceholder')}
                  className={`${inputCls} tracking-[0.35em] text-center font-semibold`}
                />
              </div>

              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 bg-gradient-to-br from-pnu-blue to-pnu-blue-light shadow-lg shadow-blue-900/25"
              >
                {submitting ? t('auth.verifying') : t('auth.verifyAndLogin')}
              </button>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials')
                    setChallengeId('')
                    setOtpCode('')
                    setError('')
                  }}
                  className="text-[12px] font-semibold text-pnu-muted hover:text-pnu-blue"
                >
                  {t('auth.backToCredentials')}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleResendCode()}
                  className="text-[12px] font-semibold text-pnu-blue hover:text-pnu-blue-light disabled:opacity-60"
                >
                  {t('auth.resendCode')}
                </button>
              </div>
            </form>
          ) : null}

          {step === 'major' ? (
            <form
              onSubmit={handleMajorSubmit}
              className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4"
            >
              <div>
                <h2 className="text-[16px] font-bold text-pnu-text">{t('auth.majorTitle')}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-pnu-muted">
                  {t('auth.majorHint')}
                </p>
              </div>

              <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {loadingMajors ? (
                  <p className="text-sm text-pnu-muted text-center py-4">{t('common.loading')}</p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-pnu-blue">Select College</label>
                      <select
                        value={selectedCollege}
                        onChange={(e) => {
                          setSelectedCollege(e.target.value)
                          setSelectedMajor('')
                        }}
                        className={inputCls}
                      >
                        <option value="">-- Choose College --</option>
                        {Array.from(new Set(majorsData.map((m) => m.department)))
                          .filter(Boolean)
                          .sort()
                          .map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                      </select>
                    </div>

                    {selectedCollege && (
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-pnu-blue">Select Major</label>
                        <select
                          value={selectedMajor}
                          onChange={(e) => setSelectedMajor(e.target.value)}
                          className={inputCls}
                        >
                          <option value="">-- Choose Major --</option>
                          {majorsData
                            .filter((m) => m.department === selectedCollege)
                            .sort((a, b) => a.major_name.localeCompare(b.major_name))
                            .map((major) => (
                              <option key={major.major_id} value={major.major_name}>
                                {major.major_name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || !selectedMajor}
                className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 bg-gradient-to-br from-pnu-blue to-pnu-blue-light shadow-lg shadow-blue-900/25"
              >
                {submitting ? t('auth.savingMajor') : t('auth.confirmMajor')}
              </button>
            </form>
          ) : null}

          {step === 'year' ? (
            <form
              onSubmit={handleYearSubmit}
              className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4"
            >
              <div>
                <h2 className="text-[16px] font-bold text-pnu-text">{t('auth.yearTitle')}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-pnu-muted">
                  {t('auth.yearHint')}
                </p>
              </div>

              <div className="space-y-1.5">
                {(
                  [
                    { value: '1' as const, labelKey: 'auth.year1' },
                    { value: '2' as const, labelKey: 'auth.year2' },
                    { value: '3' as const, labelKey: 'auth.year3' },
                    { value: '4' as const, labelKey: 'auth.year4' },
                    { value: 'exchange' as const, labelKey: 'auth.yearExchange' },
                  ] as const
                ).map(({ value, labelKey }) => {
                  const active = selectedYear === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedYear(value)}
                      className={[
                        'w-full rounded-[14px] border px-3.5 py-3 text-left text-[13px] font-semibold transition',
                        active
                          ? 'border-pnu-blue bg-[#EEF4FF] text-pnu-blue'
                          : 'border-pnu-border bg-white text-pnu-text hover:border-pnu-blue-light',
                      ].join(' ')}
                    >
                      {t(labelKey)}
                    </button>
                  )
                })}
              </div>

              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || !selectedYear}
                className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 bg-gradient-to-br from-pnu-blue to-pnu-blue-light shadow-lg shadow-blue-900/25"
              >
                {submitting ? t('auth.savingYear') : t('auth.confirmYear')}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
