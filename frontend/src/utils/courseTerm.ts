export type CourseSemester = '1' | '2' | 'SUMMER' | 'WINTER'

export interface CourseTerm {
  academicYear: number
  semester: CourseSemester
}

export function currentCourseTerm(now = new Date()): CourseTerm {
  const month = now.getMonth() + 1
  return {
    academicYear: now.getFullYear(),
    // Preserve the app's established PNU planning boundary. Summer/Winter are
    // explicit user selections; they are not inferred from a calendar month.
    semester: month >= 7 ? '2' : '1',
  }
}

export function enrollmentSemester(term: CourseTerm): string {
  const label: Record<CourseSemester, string> = {
    '1': 'Spring',
    '2': 'Fall',
    SUMMER: 'Summer',
    WINTER: 'Winter',
  }
  return `${term.academicYear}-${label[term.semester]}`
}

export function parseCourseTerm(
  academicYear: string | null,
  semester: string | null,
  fallback = currentCourseTerm(),
): CourseTerm {
  const year = Number(academicYear)
  const allowed: CourseSemester[] = ['1', '2', 'SUMMER', 'WINTER']
  return {
    academicYear: Number.isInteger(year) && year >= 2000 && year <= 2100
      ? year
      : fallback.academicYear,
    semester: allowed.includes(semester as CourseSemester)
      ? semester as CourseSemester
      : fallback.semester,
  }
}
