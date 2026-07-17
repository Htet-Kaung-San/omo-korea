import type {
  AiDashboard,
  AuthResponse,
  CampusFacilities,
  CareerOpportunitiesResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ChecklistItem,
  ChecklistPayload,
  Course,
  CourseType,
  EmergencyGuide,
  Enrollment,
  GetCampusFacilitiesParams,
  GetCareerOpportunitiesParams,
  GraduationProgress,
  HeyPnuApi,
  LoginRequest,
  MajorRecommendationRequest,
  MajorRecommendationResponse,
  Notification,
  ProgramItem,
  RecommendedCourse,
  ScholarshipItem,
  SignupRequest,
  UpdateProfileRequest,
  User,
} from '@/types/api'
import { apiFetch, clearStoredToken } from '../client'
import { CHAT_SUGGESTIONS } from '../mock/data'
import { backendFetch } from './backendFetch'
import {
  mapBackendStudent,
  mapChecklistItem,
  mapChecklistPayload,
  mapNotice,
  mapMapFacility,
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
    const studentId = resolveStudentId()
    const response = await apiFetch<{ success: true; reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: data.message,
        studentId: studentId || undefined,
      }),
    })

    return { reply: response.reply }
  },

  async getChatSuggestions(): Promise<string[]> {
    return CHAT_SUGGESTIONS
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

  async getMapFacilities() {
    const facilities = await backendFetch<Parameters<typeof mapMapFacility>[0][]>(
      '/students/facilities',
    )
    return facilities.map(mapMapFacility)
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
    const programs = await backendFetch<ProgramItem[]>('/students/programs')
    return programs.map(mapProgramItem)
  },

  async getMemory(): Promise<string> {
    const res = await apiFetch<{ success: boolean; data: string }>("/ai/memory");
    return res.data;
  },

  async updateMemory(memory: string): Promise<void> {
    await apiFetch<{ success: boolean }>("/ai/memory", {
      method: "PUT",
      body: JSON.stringify({ memory }),
    });
  },

  async forgotPassword(studentId: string): Promise<{ maskedEmail: string; code: string }> {
    const response = await apiFetch<{
      success: true
      maskedEmail: string
      code: string
    }>('/students/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
      suppressToast: true,
    })

    return {
      maskedEmail: response.maskedEmail,
      code: response.code,
    }
  },

  async resetPassword(studentId: string, code: string, newPassword: string): Promise<void> {
    await apiFetch<{ success: true }>('/students/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        code,
        new_password: newPassword,
      }),
      suppressToast: true,
    })
  },

  async signup(data: SignupRequest): Promise<void> {
    await apiFetch<{ success: true }>('/students/signup', {
      method: 'POST',
      body: JSON.stringify({
        student_id: data.studentId,
        name: data.name,
        nationality: data.nationality,
        major_name: data.major,
        student_type: data.student_type,
        visa_status: data.visa_status,
        password: data.password,
        language_pref: data.language_pref,
        is_in_korea: data.is_in_korea,
        mbti: data.mbti,
        d2_semester: data.d2_semester,
        completed_courses: data.completed_courses,
        intake_term: data.intake_term,
      }),
      suppressToast: true,
    })
  },

  async recommendMajor(data: MajorRecommendationRequest): Promise<MajorRecommendationResponse> {
    return apiFetch<MajorRecommendationResponse>('/ai/recommend-major', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getCourses(_campus?: string): Promise<Course[]> {
    return backendFetch<Course[]>('/students/courses')
  },

  async getEnrollments(studentId: string): Promise<Enrollment[]> {
    return backendFetch<Enrollment[]>(`/students/enrollments/${encodeURIComponent(studentId)}`)
  },

  async createEnrollment(studentId: string, courseId: number): Promise<Enrollment> {
    return backendFetch<Enrollment>('/students/enrollments', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        course_id: courseId,
      }),
    })
  },

  async deleteEnrollment(enrollmentId: number): Promise<void> {
    await backendFetch<unknown>(`/students/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    })
  },

  async requestAccountDeletion(studentId: string): Promise<void> {
    await backendFetch<unknown>(
      `/students/${encodeURIComponent(studentId)}/request-delete`,
      { method: 'PATCH' },
    )
  },

  async updateLanguagePreference(studentId: string, languagePref: string): Promise<void> {
    await backendFetch<unknown>(
      `/students/${encodeURIComponent(studentId)}/language`,
      {
        method: 'PATCH',
        body: JSON.stringify({ language_pref: languagePref }),
      },
    )

    const user = getSessionUser()
    if (user && user.studentId === studentId) {
      setSessionUser({ ...user, language_pref: languagePref })
    }
  },
}
