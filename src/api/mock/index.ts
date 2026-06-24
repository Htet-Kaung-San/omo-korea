import type {
  AuthResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ChecklistItem,
  ChecklistPayload,
  CourseType,
  GraduationProgress,
  HeyPnuApi,
  LoginRequest,
  Notification,
  RecommendedCourse,
  UpdateProfileRequest,
  User,
} from '@/types/api'
import {
  CHAT_FALLBACK,
  CHAT_SUGGESTIONS,
  DEMO_PASSWORD,
  DEMO_STUDENT_ID,
  mockChatIntents,
  mockChecklist,
  mockGraduationChecklist,
  mockCourses,
  mockGraduation,
  mockFreshmanGraduation,
  mockNotifications,
} from './data'

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

const TOKEN_KEY = 'hey_pnu_token'
const CHECKLIST_STORAGE_PREFIX = 'hey_pnu_checklist_'
const USER_STORAGE_PREFIX = 'hey_pnu_user_'

function getAdmissionYear(studentId: string): number | null {
  const yearPrefix = studentId.slice(0, 4)
  if (!/^\d{4}$/.test(yearPrefix)) return null
  return Number(yearPrefix)
}

function isFreshmanStudent(studentId: string): boolean {
  const admissionYear = getAdmissionYear(studentId)
  if (admissionYear === null) return false
  return admissionYear === new Date().getFullYear()
}

function getCurrentStudentId(): string {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    if (token.startsWith('mock-jwt-token-')) {
      return token.replace('mock-jwt-token-', '')
    }
    if (token === 'mock-jwt-token') {
      return DEMO_STUDENT_ID
    }
  }
  return DEMO_STUDENT_ID
}

function getMockUser(studentId: string): User {
  const isFreshman = isFreshmanStudent(studentId)
  const storageKey = `${USER_STORAGE_PREFIX}${studentId}`
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  
  // Return default mock user with given studentId
  const defaultUser: User = {
    studentId,
    name: isFreshman ? 'Jun-young Park' : 'Minh Nguyen',
    nationality: isFreshman ? 'China' : 'Vietnam',
    major: 'Computer Science & Engineering',
    interests: isFreshman ? ['Design', 'Korean Language'] : ['AI', 'Data Science'],
  }
  localStorage.setItem(storageKey, JSON.stringify(defaultUser))
  return defaultUser
}

function saveMockUser(studentId: string, user: User): void {
  const storageKey = `${USER_STORAGE_PREFIX}${studentId}`
  localStorage.setItem(storageKey, JSON.stringify(user))
}

function getChecklistVariant(studentId: string): ChecklistPayload['variant'] {
  return isFreshmanStudent(studentId) ? 'NEW_STUDENT' : 'GRADUATION_REQUIREMENT'
}

function getChecklistState(studentId: string): ChecklistItem[] {
  const variant = getChecklistVariant(studentId)
  const storageKey = `${CHECKLIST_STORAGE_PREFIX}${studentId}`
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  const defaultTemplate =
    variant === 'NEW_STUDENT' ? mockChecklist : mockGraduationChecklist
  const state = defaultTemplate.map((item) => ({ ...item }))
  localStorage.setItem(storageKey, JSON.stringify(state))
  return state
}

function saveChecklistState(studentId: string, state: ChecklistItem[]): void {
  const storageKey = `${CHECKLIST_STORAGE_PREFIX}${studentId}`
  localStorage.setItem(storageKey, JSON.stringify(state))
}

function scoreCourses(user: User): RecommendedCourse[] {
  return mockCourses
    .map((course) => {
      let score = 0
      const hints: string[] = []

      if (course.department === user.major) {
        score += 10
        hints.push('Matches your major')
      }

      const overlap = course.tags.filter((tag) => user.interests.includes(tag))
      score += overlap.length * 5
      if (overlap.length > 0) {
        hints.push(`Matches interest: ${overlap.join(', ')}`)
      }

      return {
        ...course,
        score,
        matchHint: hints[0],
      }
    })
    .filter((c) => c.score > 0 || !user.major)
    .sort((a, b) => b.score - a.score)
}

export const mockApi: HeyPnuApi = {
  async login({ studentId, password }: LoginRequest): Promise<AuthResponse> {
    await delay()
    if (password !== DEMO_PASSWORD) {
      throw new Error('Invalid student ID or password.')
    }
    
    // Accept any 9-digit student ID
    if (!/^\d{9}$/.test(studentId)) {
      throw new Error('Invalid student ID format. Must be a 9-digit number.')
    }
    
    const token = `mock-jwt-token-${studentId}`
    localStorage.setItem(TOKEN_KEY, token)
    
    const user = getMockUser(studentId)
    
    return {
      token,
      user,
    }
  },

  async logout(): Promise<void> {
    await delay(150)
    localStorage.removeItem(TOKEN_KEY)
  },

  async getMe(): Promise<User> {
    await delay()
    const studentId = getCurrentStudentId()
    return getMockUser(studentId)
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    await delay()
    const studentId = getCurrentStudentId()
    const currentUser = getMockUser(studentId)
    const updatedUser = { ...currentUser, ...data }
    saveMockUser(studentId, updatedUser)
    return updatedUser
  },

  async getRecommendedCourses(type: CourseType | 'ALL' = 'ALL'): Promise<RecommendedCourse[]> {
    await delay()
    const studentId = getCurrentStudentId()
    const user = getMockUser(studentId)
    const courses = scoreCourses(user)
    if (type === 'ALL') return courses
    return courses.filter((c) => c.type === type)
  },

  async getGraduationProgress(): Promise<GraduationProgress> {
    await delay()
    const studentId = getCurrentStudentId()
    const isFreshman = isFreshmanStudent(studentId)
    return isFreshman ? mockFreshmanGraduation : mockGraduation
  },

  async getNotifications(): Promise<Notification[]> {
    await delay()
    return [...mockNotifications].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
  },

  async getChecklist(): Promise<ChecklistPayload> {
    await delay()
    const studentId = getCurrentStudentId()
    return {
      variant: getChecklistVariant(studentId),
      items: getChecklistState(studentId),
    }
  },

  async updateChecklistItem(itemId: string, completed: boolean): Promise<ChecklistItem> {
    await delay(200)
    const studentId = getCurrentStudentId()
    const checklist = getChecklistState(studentId)
    const updatedList = checklist.map((item) =>
      item.id === itemId ? { ...item, completed } : item,
    )
    saveChecklistState(studentId, updatedList)
    const updated = updatedList.find((item) => item.id === itemId)
    if (!updated) throw new Error('Checklist item not found')
    return { ...updated }
  },

  async sendChatMessage({ message }: ChatMessageRequest): Promise<ChatMessageResponse> {
    await delay(400)
    const normalized = message.toLowerCase().trim()
    const match = mockChatIntents.find((intent) =>
      intent.keywords.some((kw) => normalized.includes(kw)),
    )
    if (match) {
      return { reply: match.reply, intentId: match.intentId }
    }
    return { reply: CHAT_FALLBACK }
  },

  async getChatSuggestions(): Promise<string[]> {
    await delay(100)
    return CHAT_SUGGESTIONS
  },
}

/** Reset mock state — useful for demos */
export function resetMockState(): void {
  const keysToClear: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith(USER_STORAGE_PREFIX) || key.startsWith(CHECKLIST_STORAGE_PREFIX) || key === TOKEN_KEY)) {
      keysToClear.push(key)
    }
  }
  keysToClear.forEach((key) => localStorage.removeItem(key))
}

export { DEMO_STUDENT_ID, DEMO_PASSWORD }
