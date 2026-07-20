import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react"
import { api } from "@/api"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import pnuSeal from "@/assets/pnu-seal.svg"

export function ForgotPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()

  const [studentId, setStudentId] = useState("202455474")
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#EEF2F7]">
        <p className="text-sm text-pnu-muted">{t("common.loading")}</p>
      </div>
    )
  }

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccessMsg("")

    if (!studentId.trim()) {
      setError("Please enter your Student ID.")
      return
    }

    setSubmitting(true)
    try {
      const res = await api.forgotPassword(studentId.trim())
      setSuccessMsg(
        `A password reset link has been sent to your email:\n${res.maskedEmail}\n\nPlease check your inbox and click the link to continue.`
      )
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find student ID.")
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-[14px] border border-pnu-border bg-pnu-surface text-pnu-text placeholder:text-[#94A3B8] text-[15px] outline-none focus:ring-2 focus:ring-pnu-blue-light/30 focus:border-pnu-blue-light transition-all"

  return (
    <div className="min-h-screen bg-[#E8EEF5] flex items-center justify-center p-4">
      {/* Mobile frame */}
      <div
        className="relative bg-pnu-surface w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 390,
          minHeight: 700,
          borderRadius: 40,
          boxShadow: "0 24px 80px rgba(0,61,130,0.18)",
        }}
      >
        {/* Status bar spacer */}
        <div className="h-11 flex-shrink-0" />

        {/* Navigation Header */}
        <div className="px-5 pt-2 pb-2 flex items-center justify-between flex-shrink-0">
          <Link
            to="/login"
            className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
            aria-label="Back to Login"
          >
            <ArrowLeft className="w-4 h-4 text-[#334155]" />
          </Link>
        </div>

        {/* Brand */}
        <div className="flex flex-col items-center pt-4 pb-6 px-6">
          <img
            src={pnuSeal}
            alt="Pusan National University"
            className="mb-4 h-20 w-20 object-contain"
          />
          <h1 className="text-[24px] font-bold tracking-tight text-pnu-blue leading-none mb-1.5 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-pnu-blue" />
            Reset Password
          </h1>
          <p className="text-[13.5px] text-pnu-muted text-center leading-snug max-w-[260px]">
            {step === 1
              ? "Enter your Student ID to receive a password reset link."
              : "Check your university email inbox."}
          </p>
        </div>

        {/* Form Card */}
        <div className="flex-1 px-5 pb-6">
          <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4">
            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-pnu-blue">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 202455474"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                {error && (
                  <p
                    className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600 leading-relaxed"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2 bg-gradient-to-br from-pnu-blue to-pnu-blue-light shadow-lg shadow-blue-900/25"
                >
                  {submitting ? "Searching..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  Reset Link Sent!
                </h2>
                <p className="text-[14px] text-emerald-700 bg-emerald-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed shadow-sm text-left">
                  {successMsg}
                </p>
                <Link
                  to="/login"
                  className="block w-full py-3.5 rounded-[14px] font-bold text-[15px] text-center text-white bg-pnu-blue hover:bg-pnu-blue-light transition-colors shadow-lg shadow-blue-900/20"
                >
                  Back to Login
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center text-[13.5px]">
            <span className="text-pnu-muted mr-1.5">Remember your password?</span>
            <Link
              to="/login"
              className="font-bold text-pnu-blue hover:text-pnu-blue-light transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
