import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  LoginChallengeResponse,
  LoginRequest,
  User,
  VerifyLoginRequest,
} from '@/types/api'
import { api, clearAuthSession, getStoredToken, setStoredToken } from '@/api'
import { AUTH_SESSION_CLEARED_EVENT } from '@/api/client'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  requestLogin: (data: LoginRequest) => Promise<LoginChallengeResponse>
  /**
   * Returns the signed-in user so the caller can branch on it immediately.
   * LoginPage needs to know whether a major is already set to decide between
   * the major and year onboarding steps, and the context `user` state has not
   * propagated yet at that point in the same tick.
   */
  verifyLogin: (data: VerifyLoginRequest) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const me = await api.getMe()
    setUser(me)
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    refreshUser()
      .catch(() => clearAuthSession())
      .finally(() => setIsLoading(false))
  }, [refreshUser])

  useEffect(() => {
    const clearInMemorySession = () => setUser(null)
    window.addEventListener(
      AUTH_SESSION_CLEARED_EVENT,
      clearInMemorySession,
    )
    return () =>
      window.removeEventListener(
        AUTH_SESSION_CLEARED_EVENT,
        clearInMemorySession,
      )
  }, [])

  const requestLogin = useCallback(async (data: LoginRequest) => {
    return api.login(data)
  }, [])

  const verifyLogin = useCallback(async (data: VerifyLoginRequest) => {
    const { token, user: loggedInUser } = await api.verifyLogin(data)
    setStoredToken(token)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      clearAuthSession()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: false,
      requestLogin,
      verifyLogin,
      logout,
      refreshUser,
    }),
    [user, isLoading, requestLogin, verifyLogin, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
