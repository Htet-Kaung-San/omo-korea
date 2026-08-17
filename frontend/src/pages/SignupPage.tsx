import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { api } from '@/api'
import { HttpError } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageSelect } from '@/components/layout/LanguageSelect'
import { NATIONALITY_OPTIONS } from '@/data/options'
import type { MajorData } from '@/types/api'
import pnuSeal from '@/assets/pnu-seal.svg'

type SignupStep = 'form' | 'otp' | 'major' | 'year' | 'nationality'

export function SignupPage() {
  const { completeSignup, isAuthenticated, isLoading } = useAuth()
  const { t, language } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<SignupStep>('form')
  const [challengeId, setChallengeId] = useState('')
  const [signupToken, setSignupToken] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [majorsData, setMajorsData] = useState<MajorData[]>([])
  const [selectedCollege, setSelectedCollege] = useState('')
  const [selectedMajor, setSelectedMajor] = useState('')
  const [loadingMajors, setLoadingMajors] = useState(false)
  const [selectedYear, setSelectedYear] = useState<'' | '1' | '2' | '3' | '4' | 'exchange'>('')
  const [selectedNationality, setSelectedNationality] = useState('')

  useEffect(() => {
    if (step !== 'major') return
    setLoadingMajors(true)
    api
      .getMajors()
      .then((res) => setMajorsData(res.data || []))
      .catch((err) => console.error('Failed to load majors', err))
      .finally(() => setLoadingMajors(false))
  }, [step])

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#EEF2F7]">
        <p className="text-sm text-pnu-muted">{t('common.loading')}</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function requestSignupChallenge() {
    const challenge = await api.signup({
      email: email.trim().toLowerCase(),
      password,
      languagePref: language,
    })
    setChallengeId(challenge.challengeId)
    setMaskedEmail(challenge.maskedEmail)
    setOtpCode('')
    setSignupToken('')
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes('@') || !password) {
      setError(t('auth.fillRequired'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }
    setSubmitting(true)
    try {
      await requestSignupChallenge()
      setStep('otp')
    } catch (err) {
      setError(
        err instanceof HttpError || err instanceof Error
          ? err.message
          : t('auth.signupError'),
      )
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
      const verified = await api.verifySignup({
        challengeId,
        code: otpCode.trim(),
      })
      setSignupToken(verified.signupToken)
      setSelectedCollege('')
      setSelectedMajor('')
      setStep('major')
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
      setSelectedYear('')
      setStep('year')
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
      setSelectedNationality('')
      setStep('nationality')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleNationalitySubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedNationality) {
      setError(t('auth.nationalityRequired'))
      return
    }
    setSubmitting(true)
    try {
      await completeSignup({
        signupToken,
        major: selectedMajor,
        year: selectedYear,
        nationality: selectedNationality,
        languagePref: language,
      })
      localStorage.setItem('hey_pnu_remembered_email', email.trim().toLowerCase())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.nationalityError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendCode() {
    setError('')
    setSubmitting(true)
    try {
      await requestSignupChallenge()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signupError'))
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
        style={{
          maxWidth: 390,
          minHeight: 700,
          borderRadius: 40,
          boxShadow: '0 24px 80px rgba(0,61,130,0.18)',
        }}
      >
        <div className="px-5 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
          {step === 'form' ? (
            <Link
              to="/login"
              className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
              aria-label={t('auth.backToLogin')}
            >
              <ArrowLeft className="w-4 h-4 text-[#334155]" />
            </Link>
          ) : (
            <span className="w-9 h-9" />
          )}
          <LanguageSelect />
        </div>

        <div className="flex flex-col items-center pt-2 pb-4 px-6">
          <img
            src={pnuSeal}
            alt="Pusan National University"
            className="mb-4 h-16 w-16 object-contain"
          />
          <h1 className="text-[22px] font-bold tracking-tight text-pnu-blue leading-none mb-2">
            {t('auth.signupTitle')}
          </h1>
          <p className="text-[13px] text-pnu-muted text-center leading-snug max-w-[240px]">
            {t('auth.signupSubtitle')}
          </p>
        </div>

        <div className="flex-1 px-5 pb-6">
          {step === 'form' ? (
            <form
              onSubmit={handleFormSubmit}
              className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-pnu-blue">
                  {t('auth.emailLabel')}
                </label>
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
                <label className="block text-[13px] font-semibold text-pnu-blue">
                  {t('auth.passwordLabel')}
                </label>
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-pnu-muted transition-colors"
                    aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
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
                {submitting ? t('auth.creatingAccount') : t('auth.createAccount')}
              </button>

              <p className="text-center text-[12px] text-pnu-muted">
                {t('auth.alreadyHave')}{' '}
                <Link to="/login" className="font-semibold text-pnu-blue hover:text-pnu-blue-light">
                  {t('auth.login')}
                </Link>
              </p>
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
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-pnu-blue">
                  {t('auth.otpLabel')}
                </label>
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
                    setStep('form')
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
                <p className="mt-1 text-[13px] leading-relaxed text-pnu-muted">{t('auth.majorHint')}</p>
              </div>
              <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {loadingMajors ? (
                  <p className="text-sm text-pnu-muted text-center py-4">{t('common.loading')}</p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-pnu-blue">
                        {t('auth.majorTitle')}
                      </label>
                      <select
                        value={selectedCollege}
                        onChange={(e) => {
                          setSelectedCollege(e.target.value)
                          setSelectedMajor('')
                        }}
                        className={inputCls}
                      >
                        <option value="">--</option>
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
                    {selectedCollege ? (
                      <div className="space-y-1.5">
                        <select
                          value={selectedMajor}
                          onChange={(e) => setSelectedMajor(e.target.value)}
                          className={inputCls}
                        >
                          <option value="">--</option>
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
                    ) : null}
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
                <p className="mt-1 text-[13px] leading-relaxed text-pnu-muted">{t('auth.yearHint')}</p>
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
                      className={`w-full rounded-[14px] border px-4 py-3 text-left text-[14px] font-semibold transition-all ${
                        active
                          ? 'border-pnu-blue bg-pnu-blue/5 text-pnu-blue'
                          : 'border-pnu-border bg-pnu-surface text-pnu-text'
                      }`}
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

          {step === 'nationality' ? (
            <form
              onSubmit={handleNationalitySubmit}
              className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4"
            >
              <div>
                <h2 className="text-[16px] font-bold text-pnu-text">{t('auth.nationalityTitle')}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-pnu-muted">
                  {t('auth.nationalityHint')}
                </p>
              </div>
              <select
                value={selectedNationality}
                onChange={(e) => setSelectedNationality(e.target.value)}
                className={inputCls}
              >
                <option value="">{t('auth.nationalityPlaceholder')}</option>
                {NATIONALITY_OPTIONS.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting || !selectedNationality || !signupToken}
                className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 bg-gradient-to-br from-pnu-blue to-pnu-blue-light shadow-lg shadow-blue-900/25"
              >
                {submitting ? t('auth.savingNationality') : t('auth.confirmNationality')}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
