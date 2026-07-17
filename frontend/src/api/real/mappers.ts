import type {
  AcademicRecords,
  ChecklistItem,
  ChecklistPayload,
  ChecklistVariant,
  CourseType,
  FacilityRoom,
  FaqItem,
  MapFacility,
  NoticeChannel,
  Notification,
  NotificationCategory,
  NotificationPriority,
  ProgramItem,
  PnuContact,
  RecommendedCourse,
  ScholarshipItem,
  User,
} from '@/types/api'

interface BackendStudent {
  student_id: string | number
  name?: string | null
  nationality?: string | null
  major_name?: string | null
  department?: string | null
  interests?: string[] | null
  student_type?: "Freshman" | "Current"
  visa_status?: string
  language_pref?: string
  email?: string
  phone?: string
  completed_courses?: string[]
  deletion_requested?: boolean
  intake_term?: "March" | "September"
}

interface BackendChecklistItem {
  checklist_id: string | number
  title?: string | null
  task_name?: string | null
  description?: string | null
  status?: string | null
}

type BackendChecklistData =
  | BackendChecklistItem[]
  | Record<string, BackendChecklistItem[]>
  | null
  | undefined

interface BackendNotice {
  id: string
  title: string
  body: string
  date?: string
  deadline?: string
  category: NotificationCategory
  priority: NotificationPriority
  source?: string | null
  channel?: NoticeChannel | null
  sourceUrl?: string | null
  read?: boolean
}

interface BackendCourse {
  id: string
  nameKo: string
  nameEn: string
  type: CourseType
  credits: number
  department: string
  tags: string[]
  score: number
  matchHint?: string
}

function getAdmissionYear(studentId: string): number | null {
  const yearPrefix = studentId.slice(0, 4)
  if (!/^\d{4}$/.test(yearPrefix)) return null
  return Number(yearPrefix)
}

export function isFreshmanStudent(studentId: string): boolean {
  const admissionYear = getAdmissionYear(studentId)
  if (admissionYear === null) return false
  return admissionYear === new Date().getFullYear()
}

export function mapBackendStudent(data: BackendStudent): User {
  return {
    studentId: String(data.student_id),
    name: data.name ?? '',
    nationality: data.nationality ?? '',
    major: data.major_name ?? data.department ?? '',
    interests: Array.isArray(data.interests) ? data.interests : [],
    studentType: data.student_type,
    visaStatus: data.visa_status,
    language_pref: data.language_pref,
    email: data.email,
    phone: data.phone,
    completed_courses: data.completed_courses,
    deletion_requested: data.deletion_requested,
    intake_term: data.intake_term,
  }
}

export function mapChecklistVariant(
  studentId: string,
  isNewFresher?: boolean,
): ChecklistVariant {
  if (isNewFresher === true || isFreshmanStudent(studentId)) return 'NEW_STUDENT'
  return 'GRADUATION_REQUIREMENT'
}

export function flattenChecklistItems(data: BackendChecklistData): BackendChecklistItem[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    return Object.values(data)
      .flat()
      .filter((item): item is BackendChecklistItem => Boolean(item && typeof item === 'object'))
  }
  return []
}

export function mapChecklistItem(item: BackendChecklistItem): ChecklistItem {
  const status = String(item.status ?? '').trim().toLowerCase()

  return {
    id: String(item.checklist_id),
    title: item.title ?? item.task_name ?? 'Untitled task',
    description: item.description ?? '',
    completed: status === 'completed' || status === 'done' || status === 'true',
  }
}

export function mapChecklistPayload(
  studentId: string,
  items: BackendChecklistData,
  options?: { isNewFresher?: boolean },
): ChecklistPayload {
  return {
    variant: mapChecklistVariant(studentId, options?.isNewFresher),
    items: flattenChecklistItems(items).map(mapChecklistItem),
  }
}

export function mapNotice(notice: BackendNotice): Notification {
  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    date: notice.date ?? notice.deadline ?? '',
    category: notice.category,
    priority: notice.priority,
    source: notice.source ?? null,
    channel: notice.channel ?? null,
    sourceUrl: notice.sourceUrl ?? null,
    read: notice.read ?? false,
  }
}

export function mapRecommendedCourse(course: BackendCourse): RecommendedCourse {
  return {
    id: course.id,
    nameKo: course.nameKo,
    nameEn: course.nameEn,
    type: course.type,
    credits: course.credits,
    department: course.department,
    tags: course.tags ?? [],
    score: course.score,
    matchHint: course.matchHint,
  }
}

export function mapScholarshipItem(scholarship: ScholarshipItem): ScholarshipItem {
  return {
    id: String(scholarship.id),
    title: scholarship.title,
    deadline: scholarship.deadline,
    description: scholarship.description,
    eligibility: scholarship.eligibility,
    amount: scholarship.amount ?? null,
    provider: scholarship.provider ?? null,
    category: scholarship.category ?? null,
    tag: scholarship.tag ?? null,
    deadlineAt: scholarship.deadlineAt ?? null,
  }
}

interface BackendMapFacility {
  facility_id: number
  name: string
  type: string
  latitude: number | string
  longitude: number | string
  hours?: string | null
  details?: string | null
  floors?: string | null
  subtitle?: string | null
  phone?: string | null
  website?: string | null
  image_url?: string | null
  departments?: Array<{ name: string; floor: string }> | string | null
  amenities?: Array<{ name: string; floor: string }> | string | null
}

function parseFacilityRooms(
  value: Array<{ name: string; floor: string }> | string | null | undefined,
): FacilityRoom[] {
  if (!value) return []
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as Array<{ name: string; floor: string }>
      return Array.isArray(parsed)
        ? parsed.map((item) => ({ name: item.name, floor: item.floor }))
        : []
    } catch {
      return []
    }
  }
  return value.map((item) => ({ name: item.name, floor: item.floor }))
}

export function mapMapFacility(row: BackendMapFacility): MapFacility {
  return {
    id: String(row.facility_id),
    name: row.name,
    type: row.type,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    hours: row.hours ?? null,
    description: row.details ?? null,
    floors: row.floors ?? null,
    subtitle: row.subtitle ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    imageUrl: row.image_url ?? null,
    departments: parseFacilityRooms(row.departments),
    amenities: parseFacilityRooms(row.amenities),
  }
}

export function mapPnuContact(row: {
  contact_id?: number | string
  slug: string
  name: string
  place: string
  hours: string
  phone: string
  email?: string | null
}): PnuContact {
  return {
    id: row.slug || String(row.contact_id),
    name: row.name,
    place: row.place,
    hours: row.hours,
    phone: row.phone,
    email: row.email ?? null,
  }
}

export function mapFaqItem(row: {
  faq_id?: number | string
  slug: string
  question: string
  answer: string
}): FaqItem {
  return {
    id: row.slug || String(row.faq_id),
    question: row.question,
    answer: row.answer,
  }
}

export function mapAcademicRecords(row: {
  student_id: string
  overall_gpa: number
  gpa_scale: number
  standing: string
  completed_credits: number
  required_credits: number
  semesters?: Array<{ semester_label: string; gpa: number }>
}): AcademicRecords {
  return {
    studentId: String(row.student_id),
    overallGpa: Number(row.overall_gpa),
    gpaScale: Number(row.gpa_scale),
    standing: row.standing,
    completedCredits: Number(row.completed_credits),
    requiredCredits: Number(row.required_credits),
    semesters: (row.semesters ?? []).map((s) => ({
      semesterLabel: s.semester_label,
      gpa: Number(s.gpa),
    })),
  }
}

export function mapProgramItem(program: ProgramItem): ProgramItem {
  return {
    id: String(program.id),
    title: program.title,
    description: program.description,
    date: program.date,
    category: program.category,
    sourceUrl: program.sourceUrl ?? null,
    score: program.score,
    matchHint: program.matchHint,
  }
}
