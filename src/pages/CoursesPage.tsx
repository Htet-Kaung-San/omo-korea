import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { CourseType, RecommendedCourse } from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { CourseCard } from '@/components/courses/CourseCard'
import { CourseFilters } from '@/components/courses/CourseFilters'

export function CoursesPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<CourseType | 'ALL'>('ALL')
  const [courses, setCourses] = useState<RecommendedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .getRecommendedCourses(filter)
      .then(setCourses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses.'))
      .finally(() => setLoading(false))
  }, [filter])

  const profileIncomplete = !user?.major

  return (
    <div>
      <PageHeader
        title="Course Recommendations"
        subtitle="Based on your major and interests"
      />

      <div className="space-y-4 px-5 py-5">
        <CourseFilters value={filter} onChange={setFilter} />

        {profileIncomplete ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Complete your major in Profile to get better recommendations.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {loading ? <p className="text-sm text-pnu-muted">Loading courses…</p> : null}

        {!loading && courses.length === 0 && !error ? (
          <p className="text-sm text-pnu-muted">No matching courses found.</p>
        ) : null}

        <div className="space-y-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  )
}
