import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CheckCircle2, AlertCircle } from "lucide-react"

// NOTE: this page is not localised yet — every string below is hardcoded
// English, unlike the rest of the app. See follow-ups.
export function UpdatePasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()

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
      setError("Invalid or missing recovery link. Please request a new password reset.")
    }
  }, [location])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      const res = await fetch("http://localhost:3000/api/students/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          new_password: newPassword
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to reset password")

      setSuccess("Your password has been successfully reset! You can now log in.")
      setNewPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-100">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {success ? (
          <div className="rounded-md bg-green-50 p-4 border border-green-100">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
                <div className="mt-4">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-sm font-medium text-pnu-blue hover:text-pnu-blue/80"
                  >
                    Return to Login &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={!accessToken || isSubmitting}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-pnu-blue focus:outline-none focus:ring-pnu-blue sm:text-sm disabled:bg-gray-50"
                  placeholder="Enter your new password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!accessToken || isSubmitting || !newPassword}
                className="flex w-full justify-center rounded-md border border-transparent bg-pnu-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-pnu-blue/90 focus:outline-none focus:ring-2 focus:ring-pnu-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
