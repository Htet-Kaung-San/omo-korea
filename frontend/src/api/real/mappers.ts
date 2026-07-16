import type {
  ChecklistItem,
  ChecklistPayload,
  ChecklistVariant,
  CourseType,
  MapFacility,
  Notification,
  NotificationCategory,
  NotificationPriority,
  ProgramItem,
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
  }
}

export function mapProgramItem(program: ProgramItem): ProgramItem {
  const sourceUrl = program.sourceUrl ?? null
  let externalApplyUrl = program.externalApplyUrl ?? null
  if (externalApplyUrl && sourceUrl && externalApplyUrl === sourceUrl) {
    externalApplyUrl = null
  }

  return {
    id: String(program.id),
    title: program.title,
    description: program.description,
    date: program.date,
    category: program.category,
    hostDepartment: program.hostDepartment ?? null,
    sourceUrl,
    externalApplyUrl,
    score: program.score,
    matchHint: program.matchHint,
  }
}
