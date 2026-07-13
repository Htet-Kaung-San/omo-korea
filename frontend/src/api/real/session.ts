import type { User } from '@/types/api'

const USER_KEY = 'hey_pnu_user'

export function getSessionUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setSessionUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSessionUser(): void {
  localStorage.removeItem(USER_KEY)
}

export function getStudentIdFromToken(): string | null {
  const token = localStorage.getItem('hey_pnu_token')
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { student_id?: string | number }
    if (payload.student_id == null) return null
    return String(payload.student_id)
  } catch {
    return null
  }
}

export function resolveStudentId(): string | null {
  return getSessionUser()?.studentId ?? getStudentIdFromToken()
}
