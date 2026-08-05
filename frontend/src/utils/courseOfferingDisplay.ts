import type { RecommendedCourse } from '@/types/api'

const originalLanguageKeys = {
  C: 'courseOffering.chinese',
  J: 'courseOffering.japanese',
  F: 'courseOffering.french',
  G: 'courseOffering.german',
  R: 'courseOffering.russian',
} as const

const teachingLanguageKeys = {
  KOREAN: 'courseOffering.korean',
  MIXED: 'courseOffering.mixedLanguage',
  OTHER: 'courseOffering.otherLanguage',
} as const

const remoteStatusKeys = {
  REMOTE: 'courseOffering.remote',
  NOT_REMOTE: 'courseOffering.notRemote',
  MIXED: 'courseOffering.mixedRemote',
  OTHER: 'courseOffering.otherRemote',
} as const

export function getCourseLanguageBadgeKey(
  course: Pick<
    RecommendedCourse,
    'isEnglishTaught' | 'originalLanguageCode' | 'teachingLanguage'
  >,
): string | null {
  if (course.isEnglishTaught === true) return 'courseOffering.englishTaught'
  if (course.originalLanguageCode && course.originalLanguageCode !== 'E') {
    return originalLanguageKeys[course.originalLanguageCode] ?? null
  }
  if (course.teachingLanguage && course.teachingLanguage !== 'ENGLISH') {
    return teachingLanguageKeys[course.teachingLanguage] ?? null
  }
  return null
}

export function getRemoteCourseStatusKey(
  status: RecommendedCourse['remoteCourseStatus'],
): string | null {
  return status ? remoteStatusKeys[status] : null
}

function nullableDisplayText(value: string | null): string | null {
  const normalized = value?.trim()
  return normalized || null
}

function requirementKey(
  field: 'presentation' | 'groupProject' | 'assignment',
  value: RecommendedCourse[
    | 'presentationRequirement'
    | 'groupProjectRequirement'
    | 'assignmentRequirement'
  ],
): string | null {
  if (value === null) return null
  if (field === 'presentation' && value === 'NONE') return null
  return `courseMetadata.${field}.${value.toLowerCase()}`
}

export function getVerifiedCourseOfferingDisplay(course: RecommendedCourse) {
  const presentationRequirementKey = requirementKey(
    'presentation',
    course.presentationRequirement,
  )
  const groupProjectRequirementKey = requirementKey(
    'groupProject',
    course.groupProjectRequirement,
  )
  const assignmentRequirementKey = requirementKey(
    'assignment',
    course.assignmentRequirement,
  )
  const examInformation = nullableDisplayText(course.examInformation)
  return {
    languageBadgeKey: getCourseLanguageBadgeKey(course),
    remoteStatusKey: getRemoteCourseStatusKey(course.remoteCourseStatus),
    officialCourseNumber: nullableDisplayText(course.officialCourseNumber),
    term:
      course.academicYear !== null && course.semester
        ? `${course.academicYear}-${course.semester}`
        : null,
    section: nullableDisplayText(course.section),
    professor: nullableDisplayText(course.professor),
    schedule: nullableDisplayText(course.schedule),
    presentationRequirementKey,
    groupProjectRequirementKey,
    assignmentRequirementKey,
    examInformation,
    hasAssessmentMetadata: Boolean(
      presentationRequirementKey ||
        groupProjectRequirementKey ||
        assignmentRequirementKey ||
        examInformation,
    ),
  }
}
