import type {
  AiDashboard,
  AuthResponse,
  CampusFacilities,
  CareerOpportunitiesResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ChecklistItem,
  ChecklistPayload,
  CourseType,
  EmergencyGuide,
  GetCampusFacilitiesParams,
  GetCareerOpportunitiesParams,
  GraduationProgress,
  HeyPnuApi,
  LoginRequest,
  Notification,
  ProgramItem,
  RecommendedCourse,
  ScholarshipItem,
  UpdateProfileRequest,
  User,
} from '@/types/api'
import { apiFetch, clearStoredToken } from '../client'
import { backendFetch } from './backendFetch'
import {
  mapBackendStudent,
  mapChecklistItem,
  mapChecklistPayload,
  mapNotice,
  mapProgramItem,
  mapRecommendedCourse,
  mapScholarshipItem,
} from './mappers'
import {
  clearSessionUser,
  getSessionUser,
  resolveStudentId,
  setSessionUser,
} from './session'

interface BackendLoginResponse {
  success: true
  token: string
  data: Parameters<typeof mapBackendStudent>[0]
}

function emptyGraduationProgress(): GraduationProgress {
  const empty = { completed: 0, required: 0 }

  return {
    totalRequired: 0,
    totalCompleted: 0,
    breakdown: {
      generalRequired: empty,
      generalElective: empty,
      majorBasic: empty,
      majorRequired: empty,
      majorElective: empty,
      generalFree: empty,
    },
  }
}

function requireStudentId(): string {
  const studentId = resolveStudentId()
  if (!studentId) {
    throw new Error('Not authenticated')
  }
  return studentId
}

/** HTTP adapter wired to the Express + Supabase backend */
export const realApi: HeyPnuApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiFetch<BackendLoginResponse>('/students/login', {
      method: 'POST',
      body: JSON.stringify({
        student_id: data.studentId,
        password: data.password,
      }),
      suppressToast: true,
    })

    const user = mapBackendStudent(response.data)
    setSessionUser(user)

    return {
      token: response.token,
      user,
    }
  },

  async logout(): Promise<void> {
    clearStoredToken()
    clearSessionUser()
  },

  async getMe(): Promise<User> {
    const user = getSessionUser()
    if (!user) {
      throw new Error('Not authenticated')
    }
    return user
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const updated = await backendFetch<Parameters<typeof mapBackendStudent>[0]>('/students/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        nationality: data.nationality,
        interests: data.interests,
        language_pref: data.languagePref,
        visa_status: data.visaStatus,
        mbti: data.mbti,
        phone: data.phone,
      }),
    })

    const user = mapBackendStudent(updated)
    user.major = data.major || user.major
    setSessionUser(user)
    return user
  },

  async getRecommendedCourses(type?: CourseType | 'ALL'): Promise<RecommendedCourse[]> {
    const dashboard = await backendFetch<{
      recommendedCourses?: Parameters<typeof mapRecommendedCourse>[0][]
    }>('/students/ai-dashboard')

    const courses = (dashboard.recommendedCourses ?? []).map(mapRecommendedCourse)
    if (type && type !== 'ALL') {
      return courses.filter((course) => course.type === type)
    }
    return courses
  },

  async getGraduationProgress(): Promise<GraduationProgress> {
    return emptyGraduationProgress()
  },

  async getNotifications(): Promise<Notification[]> {
    const notifications = await backendFetch<Parameters<typeof mapNotice>[0][]>(
      '/students/notifications',
    )

    return notifications.map(mapNotice)
  },

  async getChecklist(): Promise<ChecklistPayload> {
    const studentId = requireStudentId()
    // Backend returns grouped checklist by semester plus is_new_fresher.
    const body = await apiFetch<{
      success: true
      is_new_fresher?: boolean
      data:
        | Parameters<typeof mapChecklistItem>[0][]
        | Record<string, Parameters<typeof mapChecklistItem>[0][]>
    }>(`/students/checklist/${studentId}`)

    return mapChecklistPayload(studentId, body.data, {
      isNewFresher: body.is_new_fresher,
    })
  },

  async updateChecklistItem(itemId: string, completed: boolean): Promise<ChecklistItem> {
    const updated = await backendFetch<Parameters<typeof mapChecklistItem>[0]>(
      `/students/checklist/${itemId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ status: completed ? 'Completed' : 'Not Started' }),
      },
    )

    return mapChecklistItem(updated)
  },

  async sendChatMessage(data: ChatMessageRequest): Promise<ChatMessageResponse> {
    void data
    return { reply: '' }
  },

  async getChatSuggestions(): Promise<string[]> {
    return []
  },

  async getCareerOpportunities(
    params: GetCareerOpportunitiesParams = {},
  ): Promise<CareerOpportunitiesResponse> {
    const query = new URLSearchParams()
    const page = params.page ?? 1
    const limit = params.limit ?? 10

    query.set('page', String(page))
    query.set('limit', String(limit))

    return backendFetch<CareerOpportunitiesResponse>(
      `/students/career-opportunities?${query.toString()}`,
    )
  },

  async getEmergencyGuide(): Promise<EmergencyGuide> {
    return backendFetch<EmergencyGuide>('/students/emergency-guide')
  },

  async getCampusFacilities(params?: GetCampusFacilitiesParams): Promise<CampusFacilities> {
    const query = params?.menuDate
      ? `?menu_date=${encodeURIComponent(params.menuDate)}`
      : ''
    return backendFetch<CampusFacilities>(`/students/campus-facilities${query}`)
  },

  async getAiDashboard(): Promise<AiDashboard> {
    const dashboard = await backendFetch<{
      recommendedCourses?: Parameters<typeof mapRecommendedCourse>[0][]
      eligibleScholarships?: ScholarshipItem[]
      matchedPrograms?: ProgramItem[]
    }>('/students/ai-dashboard')

    return {
      recommendedCourses: (dashboard.recommendedCourses ?? []).map(mapRecommendedCourse),
      eligibleScholarships: (dashboard.eligibleScholarships ?? []).map(mapScholarshipItem),
      matchedPrograms: (dashboard.matchedPrograms ?? []).map(mapProgramItem),
    }
  },

  async getScholarships(): Promise<ScholarshipItem[]> {
    const scholarships = await backendFetch<ScholarshipItem[]>('/students/scholarships')
    return scholarships.map(mapScholarshipItem)
  },

  async getPrograms(): Promise<ProgramItem[]> {
    const dashboard = await this.getAiDashboard()
    return dashboard.matchedPrograms
  },
}
