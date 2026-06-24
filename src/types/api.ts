/** Shared API types — keep in sync with backend OpenAPI / PROJECT_SPEC.md */

export type CourseType = 'REQUIRED' | 'ELECTIVE' | 'GEN_ED'

export type NotificationCategory = 'REGISTRATION' | 'DEADLINE' | 'GENERAL'
export type NotificationPriority = 'HIGH' | 'NORMAL'

export interface User {
  studentId: string
  name: string
  nationality: string
  major: string
  interests: string[]
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  studentId: string
  password: string
}

export interface UpdateProfileRequest {
  name: string
  nationality: string
  major: string
  interests: string[]
}

export interface Course {
  id: string
  nameKo: string
  nameEn: string
  type: CourseType
  credits: number
  department: string
  tags: string[]
}

export interface RecommendedCourse extends Course {
  score: number
  matchHint?: string
}

export interface CreditBreakdown {
  completed: number
  required: number
}

export interface GraduationProgress {
  totalRequired: number
  totalCompleted: number
  breakdown: {
    required: CreditBreakdown
    elective: CreditBreakdown
    genEd: CreditBreakdown
  }
}

export interface Notification {
  id: string
  title: string
  body: string
  date: string
  category: NotificationCategory
  priority: NotificationPriority
}

export interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
}

export type ChecklistVariant = 'NEW_STUDENT' | 'GRADUATION_REQUIREMENT'

export interface ChecklistPayload {
  variant: ChecklistVariant
  items: ChecklistItem[]
}

export interface ChatMessageRequest {
  message: string
}

export interface ChatMessageResponse {
  reply: string
  intentId?: string
}

export interface ApiError {
  message: string
  status?: number
}

/** Backend team: implement these endpoints — see BACKEND.md */
export interface HeyPnuApi {
  login(data: LoginRequest): Promise<AuthResponse>
  logout(): Promise<void>
  getMe(): Promise<User>
  updateProfile(data: UpdateProfileRequest): Promise<User>
  getRecommendedCourses(type?: CourseType | 'ALL'): Promise<RecommendedCourse[]>
  getGraduationProgress(): Promise<GraduationProgress>
  getNotifications(): Promise<Notification[]>
  getChecklist(): Promise<ChecklistPayload>
  updateChecklistItem(itemId: string, completed: boolean): Promise<ChecklistItem>
  sendChatMessage(data: ChatMessageRequest): Promise<ChatMessageResponse>
  getChatSuggestions(): Promise<string[]>
}
