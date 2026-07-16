import type {
  AiDashboard,
  AuthResponse,
  CampusFacilities,
  CareerOpportunitiesResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ChecklistPayload,
  CourseType,
  EmergencyGuide,
  
  GetCareerOpportunitiesParams,
  GraduationProgress,
  HeyPnuApi,
  LoginRequest,
  SignupRequest,
  
  MajorRecommendationResponse,
  Course,
  Enrollment,
  ChecklistItem,
  Notification,
  ProgramItem,
  RecommendedCourse,
  ScholarshipItem,
  UpdateProfileRequest,
  User,
} from '@/types/api'
import {
  CHAT_FALLBACK,
  CHAT_SUGGESTIONS,
  DEMO_PASSWORD,
  DEMO_STUDENT_ID,
  mockCampusFacilities,
  mockMapFacilities,
  mockCareerOpportunities,
  mockChatIntents,
  mockEmergencyGuide,
  mockPrograms,
  mockScholarships,
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

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

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
  const stored = readJson<User>(storageKey)
  if (stored) {
    return stored
  }

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
  const defaultTemplate =
    variant === 'NEW_STUDENT' ? mockChecklist : mockGraduationChecklist

  const storageKey = `${CHECKLIST_STORAGE_PREFIX}${studentId}`
  const stored = readJson<ChecklistItem[]>(storageKey)

  // Merge stored completion status with the fresh data.ts template.
  // This guarantees structural updates (like adding locks) are never lost.
  const state = defaultTemplate.map((item) => {
    const storedItem = (stored || []).find((s) => s.id === item.id)
    return {
      ...item,
      // Preserve the saved checkmark if it exists, otherwise use the default
      completed: storedItem ? storedItem.completed : item.completed,
    }
  })

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
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.nameEn.localeCompare(b.nameEn)
    })
}

function summarizeMockCareers() {
  const counts = new Map<string, number>()

  mockCareerOpportunities.forEach((item) => {
    if (!item.role) return
    counts.set(item.role, (counts.get(item.role) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function paginateMockCareerOpportunities({
  page = 1,
  limit = 10,
}: GetCareerOpportunitiesParams = {}): CareerOpportunitiesResponse {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10
  const totalItems = mockCareerOpportunities.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit))
  const boundedPage = Math.min(safePage, totalPages)
  const start = (boundedPage - 1) * safeLimit

  return {
    source: 'https://www.jobkorea.co.kr/theme/entry-level-internship',
    careers: summarizeMockCareers(),
    opportunities: mockCareerOpportunities.slice(start, start + safeLimit),
    pagination: {
      page: boundedPage,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasNextPage: boundedPage < totalPages,
      hasPrevPage: boundedPage > 1,
    },
    fetchedAt: new Date().toISOString(),
  }
}

export const mockApi: HeyPnuApi = {
  async login({ studentId, password }: LoginRequest): Promise<AuthResponse> {
    await delay()
    if (password !== DEMO_PASSWORD) {
      throw new Error('Invalid student ID or password.')
    }

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

  async forgotPassword(_studentId: string): Promise<{ maskedEmail: string; code: string }> {
    await delay()
    return { maskedEmail: 't***@example.com', code: '123456' }
  },

  async resetPassword(_studentId: string, _code: string, _newPassword: string): Promise<void> {
    await delay()
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

  async getCareerOpportunities(params?: GetCareerOpportunitiesParams): Promise<CareerOpportunitiesResponse> {
    await delay()
    return paginateMockCareerOpportunities(params)
  },

  async getEmergencyGuide(): Promise<EmergencyGuide> {
    await delay()
    return mockEmergencyGuide
  },

  async getCampusFacilities(): Promise<CampusFacilities> {
    await delay()
    return mockCampusFacilities
  },

  async getMapFacilities() {
    await delay()
    return mockMapFacilities
  },

  async getAiDashboard(): Promise<AiDashboard> {
    await delay()
    const studentId = getCurrentStudentId()
    const user = getMockUser(studentId)
    const courses = scoreCourses(user)

    return {
      recommendedCourses: courses,
      eligibleScholarships: mockScholarships,
      matchedPrograms: mockPrograms,
    }
  },

  async getScholarships(): Promise<ScholarshipItem[]> {
    await delay()
    return mockScholarships
  },

  async getPrograms(): Promise<ProgramItem[]> {
    await delay()
    return mockPrograms
  },

  async getMemory(): Promise<string> {
    await delay()
    return localStorage.getItem('mock_memory') || ''
  },

  async updateMemory(memory: string): Promise<void> {
    await delay()
    localStorage.setItem('mock_memory', memory)
  },

  async signup(_data: SignupRequest): Promise<void> {
    await delay()
  },

  async recommendMajor(): Promise<MajorRecommendationResponse> {
    await delay()
    return { success: true, recommendationMethod: 'mock', recommendations: [], aiAnalysis: null, warning: null }
  },

  async getCourses(): Promise<Course[]> {
    await delay()
    return []
  },

  async getEnrollments(): Promise<Enrollment[]> {
    await delay()
    return []
  },

  async createEnrollment(studentId: string, courseId: number): Promise<Enrollment> {
    await delay()
    return { enrollment_id: 1, student_id: studentId, course_id: courseId, semester: '2026-1', status: 'Enrolled' }
  },

  async deleteEnrollment(): Promise<void> {
    await delay()
  },

  async requestAccountDeletion(): Promise<void> {
    await delay()
  },

  async updateLanguagePreference(): Promise<void> {
    await delay()
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
