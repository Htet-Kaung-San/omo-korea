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
import { apiFetch } from '../client'

/** HTTP adapter — wire to backend endpoints defined in PROJECT_SPEC.md */
export const realApi: HeyPnuApi = {
  login(data: LoginRequest): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  logout(): Promise<void> {
    return apiFetch<void>('/auth/logout', { method: 'POST' })
  },

  getMe(): Promise<User> {
    return apiFetch<User>('/users/me')
  },

  updateProfile(data: UpdateProfileRequest): Promise<User> {
    return apiFetch<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  getRecommendedCourses(type?: CourseType | 'ALL'): Promise<RecommendedCourse[]> {
    const query = type && type !== 'ALL' ? `?type=${type}` : ''
    return apiFetch<RecommendedCourse[]>(`/courses/recommended${query}`)
  },

  getGraduationProgress(): Promise<GraduationProgress> {
    return apiFetch<GraduationProgress>('/graduation/progress')
  },

  getNotifications(): Promise<Notification[]> {
    return apiFetch<Notification[]>('/notifications')
  },

  getChecklist(): Promise<ChecklistPayload> {
    return apiFetch<ChecklistPayload>('/checklist')
  },

  updateChecklistItem(itemId: string, completed: boolean): Promise<ChecklistItem> {
    return apiFetch<ChecklistItem>(`/checklist/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    })
  },

  sendChatMessage(data: ChatMessageRequest): Promise<ChatMessageResponse> {
    return apiFetch<ChatMessageResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getChatSuggestions(): Promise<string[]> {
    return apiFetch<string[]>('/chat/suggestions')
  },
}
