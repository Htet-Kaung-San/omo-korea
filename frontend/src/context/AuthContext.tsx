import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoginRequest, User } from '@/types/api'
import { api, clearAuthSession, getStoredToken, setStoredToken } from '@/api'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
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

  const login = useCallback(async (data: LoginRequest) => {
    const { token, user: loggedInUser } = await api.login(data)
    setStoredToken(token)
    setUser(loggedInUser)
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
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
