import type {
  ChecklistItem,
  ChecklistPayload,
  ChecklistVariant,
  CourseType,
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
  description?: string | null
  status?: string | null
}

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

export function mapChecklistVariant(studentId: string): ChecklistVariant {
  return isFreshmanStudent(studentId) ? 'NEW_STUDENT' : 'GRADUATION_REQUIREMENT'
}

export function mapChecklistItem(item: BackendChecklistItem): ChecklistItem {
  const status = String(item.status ?? '').trim().toLowerCase()

  return {
    id: String(item.checklist_id),
    title: item.title ?? 'Untitled task',
    description: item.description ?? '',
    completed: status === 'completed' || status === 'done' || status === 'true',
  }
}

export function mapChecklistPayload(
  studentId: string,
  items: BackendChecklistItem[],
): ChecklistPayload {
  return {
    variant: mapChecklistVariant(studentId),
    items: items.map(mapChecklistItem),
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

export function mapProgramItem(program: ProgramItem): ProgramItem {
  return {
    id: String(program.id),
    title: program.title,
    description: program.description,
    date: program.date,
    category: program.category,
    score: program.score,
    matchHint: program.matchHint,
  }
}
