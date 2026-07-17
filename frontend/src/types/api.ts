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
  studentType?: "Freshman" | "Current"
  visaStatus?: string
  language_pref?: string
  email?: string
  phone?: string
  completed_courses?: string[]
  deletion_requested?: boolean
  intake_term?: "March" | "September"
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  studentId: string
  password: string
}

export interface SignupRequest {
  studentId: string;
  name: string;
  nationality: string;
  major: string;
  student_type: "Freshman" | "Current";
  visa_status: string;
  password: string;
  language_pref?: string;
  is_in_korea?: boolean;
  mbti?: string;
  d2_semester?: number;
  completed_courses?: string[];
  intake_term?: "March" | "September";
}

export interface MajorRecommendationRequest {
  academicAreas: string[];
  activities: string[];
  strengths: string[];
  careerAreas: string[];
  learningStyles: string[];
  topikLevel: number;
  topN?: number;
}

export interface UpdateProfileRequest {
  name: string
  nationality: string
  major: string
  interests: string[]
  languagePref?: string
  visaStatus?: string
  mbti?: string
  phone?: string
  email?: string
  completed_courses?: string[]
  intake_term?: "March" | "September"
  current_password?: string
  new_password?: string
}

export interface ProgramItem {
  id: string
  title: string
  description: string
  date: string
  category?: string
  sourceUrl?: string | null
  score?: number
  matchHint?: string
}

export interface ScholarshipItem {
  id: string
  title: string
  deadline: string
  description: string
  eligibility: string
  amount?: string | null
  provider?: string | null
}

export interface EmergencyQuickAccess {
  number: string
  label: string
}

export interface EmergencyContact {
  id: string
  type: string
  name: string
  phone: string | null
  country_flag?: string | null
  distance?: string | null
  map_query?: string | null
}

export interface EmergencyGuide {
  quick_access: {
    police: EmergencyQuickAccess
    fire_medical: EmergencyQuickAccess
    disease_control: EmergencyQuickAccess
  }
  database_contacts: EmergencyContact[]
  guide_text: string
}

export interface PnuContact {
  id: string
  name: string
  place: string
  hours: string
  phone: string
  email: string | null
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export type CommunityScope = 'department' | 'country' | 'all'

export interface CommunityGroup {
  id: string
  groupId: number
  slug: string
  scope: CommunityScope
  name: string
  icon: string
  memberCount: number
  newPostCount: number
  joined: boolean
  bannerTitle: string
  bannerBody: string
}

export interface CommunityMember {
  id: string
  name: string
  nationality: string
  major: string
  avatarTone: string
}

export interface CommunityPost {
  id: string
  groupId: number | null
  groupSlug: string | null
  scope: CommunityScope
  content: string
  hashtags: string[]
  likes: number
  comments: number
  createdAt: string
  authorName: string
  authorInitials: string
  authorMajor: string
  majorTone: string
  authorNationality: string
  timeAgo: string
  eventDate?: {
    month: string
    day: string
    weekday: string
  } | null
}

export interface CommunityMembersResponse {
  group: CommunityGroup
  members: CommunityMember[]
}

export interface CreateCommunityPostRequest {
  content: string
  scope: CommunityScope
  groupId?: number | null
  groupSlug?: string | null
}

export interface CafeteriaMenuColumn {
  day: string
  day_label: string
  price?: string | null
  items: string[]
  note?: string | null
}

export interface CafeteriaMenuRow {
  meal_type: string
  meal_label: string
  columns: CafeteriaMenuColumn[]
}

export interface CafeteriaMenu {
  week_start?: string | null
  week_end?: string | null
  week_label?: string | null
  prev_menu_date?: string | null
  next_menu_date?: string | null
  rows: CafeteriaMenuRow[]
}

export interface GetCampusFacilitiesParams {
  menuDate?: string
}

export interface CampusFacility {
  id: string
  name: string
  location?: string | null
  hours?: string | null
  description?: string | null
  menu?: CafeteriaMenu
}

export interface CampusFacilities {
  shuttle_bus_metadata: {
    key_stops: CampusFacility[]
  }
  cafeterias: CampusFacility[]
  cafeteria_source?: string
  scraped_at?: string | null
  menu_date?: string | null
}

export interface MapFacility {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  hours?: string | null
  description?: string | null
  floors?: string | null
  subtitle?: string | null
  phone?: string | null
  website?: string | null
  imageUrl?: string | null
  departments?: FacilityRoom[]
  amenities?: FacilityRoom[]
}

export interface FacilityRoom {
  name: string
  floor: string
}

export interface AcademicSemesterRecord {
  semesterLabel: string
  gpa: number
}

export interface AcademicRecords {
  studentId: string
  overallGpa: number
  gpaScale: number
  standing: string
  completedCredits: number
  requiredCredits: number
  semesters: AcademicSemesterRecord[]
}

export interface AiDashboard {
  recommendedCourses: RecommendedCourse[]
  eligibleScholarships: ScholarshipItem[]
  matchedPrograms: ProgramItem[]
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

export interface RecommendedMajor {
  id: string;
  name: string;
  nameKo: string;
  score: number;
  rank: number;
  reason: string;
  eligibilityNote: string;
  claudeReason: string | null;
}

export interface AiAnalysis {
  summary: string;
  gapAnalysis: string[];
}

export interface MajorRecommendationResponse {
  success: boolean;
  recommendationMethod: string;
  recommendations: RecommendedMajor[];
  aiAnalysis: AiAnalysis | null;
  warning: string | null;
}

export interface CreditBreakdown {
  completed: number
  required: number
}

export interface Enrollment {
  enrollment_id: number;
  student_id: string;
  course_id: number;
  semester: string;
  status: string;
  course_name?: string;
  credit?: number;
  category?: string;
  classroom?: string;
}

export interface GraduationProgress {
  totalRequired: number
  totalCompleted: number
  breakdown: {
    /** 교양필수 – General Required */
    generalRequired: CreditBreakdown
    /** 교양선택 – General Elective */
    generalElective: CreditBreakdown
    /** 전공기초 – Major Basic */
    majorBasic: CreditBreakdown
    /** 전공필수 – Major Required */
    majorRequired: CreditBreakdown
    /** 전공선택 – Major Elective */
    majorElective: CreditBreakdown
    /** 일반선택 – General Free Elective */
    generalFree: CreditBreakdown
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

export interface CreditRequirement {
  /** Which breakdown bucket must meet the threshold */
  category: keyof GraduationProgress['breakdown'] | 'total'
}

export interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  /** If set, item is locked until the credit requirement is met */
  creditRequirement?: CreditRequirement
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

export type CareerJobType = 'internship' | 'part-time' | 'full-time' | 'volunteer'

export interface CareerOpportunity {
  id: string
  source: string
  company: string
  title: string
  deadline: string
  role: string | null
  applicationType: string | null
  sourceUrl: string
  /** Optional fields for Internships UI + AI recommendations */
  location?: string | null
  jobType?: CareerJobType | null
  logoUrl?: string | null
  /** Short reason from the AI recommender (shown under recommended cards) */
  matchReason?: string | null
}

export interface CareerSummary {
  name: string
  count: number
}

export interface CareerOpportunitiesPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface CareerOpportunitiesResponse {
  source: string
  careers: CareerSummary[]
  opportunities: CareerOpportunity[]
  pagination: CareerOpportunitiesPagination
  fetchedAt: string
}

export interface GetCareerOpportunitiesParams {
  page?: number
  limit?: number
}

/** Backend team: implement these endpoints — see BACKEND.md */
export interface HeyPnuApi {
  login(data: LoginRequest): Promise<AuthResponse>
  logout(): Promise<void>
  getMe(): Promise<User>
  updateProfile(data: UpdateProfileRequest): Promise<User>
  forgotPassword(studentId: string): Promise<{ maskedEmail: string; code: string }>
  resetPassword(studentId: string, code: string, newPassword: string): Promise<void>
  getRecommendedCourses(type?: CourseType | 'ALL'): Promise<RecommendedCourse[]>
  getGraduationProgress(): Promise<GraduationProgress>
  getNotifications(): Promise<Notification[]>
  getChecklist(): Promise<ChecklistPayload>
  updateChecklistItem(itemId: string, completed: boolean): Promise<ChecklistItem>
  sendChatMessage(data: ChatMessageRequest): Promise<ChatMessageResponse>
  getChatSuggestions(): Promise<string[]>
  getCareerOpportunities(params?: GetCareerOpportunitiesParams): Promise<CareerOpportunitiesResponse>
  /**
   * AI hook-point: personalized internship/job recommendations.
   * Backend: GET /students/career-recommendations
   */
  getRecommendedCareerOpportunities(): Promise<CareerOpportunity[]>
  getEmergencyGuide(): Promise<EmergencyGuide>
  getPnuContacts(): Promise<PnuContact[]>
  getFaqItems(): Promise<FaqItem[]>
  getMyCommunityGroup(scope: CommunityScope): Promise<CommunityGroup | null>
  getCommunityPosts(params: {
    scope: CommunityScope
    groupSlug?: string | null
    groupId?: number | null
  }): Promise<CommunityPost[]>
  getCommunityMembers(groupIdOrSlug: string): Promise<CommunityMembersResponse>
  createCommunityPost(data: CreateCommunityPostRequest): Promise<CommunityPost>
  likeCommunityPost(postId: string): Promise<{ id: string; likes: number }>
  getCampusFacilities(params?: GetCampusFacilitiesParams): Promise<CampusFacilities>
  getMapFacilities(): Promise<MapFacility[]>
  getMapFacility(id: string): Promise<MapFacility>
  getAcademicRecords(): Promise<AcademicRecords>
  downloadTranscript(): Promise<Blob>
  getAiDashboard(): Promise<AiDashboard>
  getScholarships(): Promise<ScholarshipItem[]>
  getPrograms(): Promise<ProgramItem[]>
  getMemory(): Promise<string>
  updateMemory(memory: string): Promise<void>
  signup(data: SignupRequest): Promise<void>
  recommendMajor(data: MajorRecommendationRequest): Promise<MajorRecommendationResponse>
  getCourses(campus?: string): Promise<Course[]>
  getEnrollments(studentId: string): Promise<Enrollment[]>
  createEnrollment(studentId: string, courseId: number): Promise<Enrollment>
  deleteEnrollment(enrollmentId: number): Promise<void>
  requestAccountDeletion(studentId: string): Promise<void>
  updateLanguagePreference(studentId: string, languagePref: string): Promise<void>
}
