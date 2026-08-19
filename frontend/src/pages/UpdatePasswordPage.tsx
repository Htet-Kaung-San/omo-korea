import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"
import pnuSeal from "@/assets/pnu-seal.svg"

/**
 * The second half of the password reset, reached from the emailed link.
 *
 * Laid out to match ForgotPasswordPage, which is the screen the student was
 * looking at a moment earlier. It previously used stock Tailwind defaults —
 * a gray page, a square card, sm:text-sm — so following the link dropped the
 * user out of the app's own design and onto something that looked like a
 * different site asking for a password. That is the last impression you want
 * to give on the one screen where someone is typing a new credential.
 */
export function UpdatePasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [newPassword, setNewPassword] = useState("")
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Supabase redirects to /update-password#access_token=...&refresh_token=...&type=recovery
    const hash = location.hash.substring(1) // remove the '#'
    const params = new URLSearchParams(hash)
    const token = params.get("access_token")
    const type = params.get("type")

    if (token && type === "recovery") {
      setAccessToken(token)
    } else {
      setError(t("auth.updateInvalidLink"))
    }
  }, [location, t])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    if (newPassword.length < 6) {
      setError(t("auth.updateTooShort"))
      return
    }

    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      // VITE_API_BASE_URL already ends in /api, so the path must not repeat it.
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
      const res = await fetch(`${baseUrl}/students/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          new_password: newPassword
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || t("auth.updateFailed"))

      setSuccess(t("auth.updateSuccess"))
      setNewPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.updateFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-[14px] border border-pnu-border bg-pnu-surface text-pnu-text placeholder:text-[#94A3B8] text-[15px] outline-none focus:ring-2 focus:ring-pnu-blue-light/30 focus:border-pnu-blue-light transition-all disabled:opacity-60"

  return (
    <div className="min-h-screen bg-[#E8EEF5] flex items-center justify-center p-4">
      {/* Mobile frame — same dimensions as ForgotPasswordPage and LoginPage. */}
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
            aria-label={t("auth.backToLogin")}
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
            {t("auth.updateTitle")}
          </h1>
          <p className="text-[13.5px] text-pnu-muted text-center leading-snug max-w-[260px]">
            {t("auth.updateSubtitle")}
          </p>
        </div>

        {/* Form Card */}
        <div className="flex-1 px-5 pb-6">
          <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,61,130,0.08)] p-6 space-y-4">
            {success ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  {t("auth.updateSuccessTitle")}
                </h2>
                <p className="text-[14px] text-emerald-700 bg-emerald-50 p-4 rounded-xl leading-relaxed shadow-sm text-left">
                  {success}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="block w-full py-3.5 rounded-[14px] font-bold text-[15px] text-center text-white bg-pnu-blue hover:bg-pnu-blue-light transition-colors shadow-lg shadow-blue-900/20"
                >
                  {t("auth.backToLogin")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-password"
                    className="block text-[13px] font-semibold text-pnu-blue"
                  >
                    {t("auth.updatePasswordLabel")}
                  </label>
                  <input
                    id="new-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={!accessToken || isSubmitting}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("auth.updatePasswordPlaceholder")}
                    className={inputCls}
                    autoFocus
                  />
                  <p className="text-[12px] text-pnu-muted">
                    {t("auth.updatePasswordHint")}
                  </p>
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
                  disabled={!accessToken || isSubmitting || !newPassword}
                  className="w-full py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2 bg-gradient-to-br from-pnu-blue to-pnu-blue-light shadow-lg shadow-blue-900/25"
                >
                  {isSubmitting ? t("common.saving") : t("auth.updateSubmit")}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 flex justify-center text-[13.5px]">
            <span className="text-pnu-muted mr-1.5">{t("auth.rememberPassword")}</span>
            <Link
              to="/login"
              className="font-bold text-pnu-blue hover:text-pnu-blue-light transition-colors"
            >
              {t("auth.logIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
