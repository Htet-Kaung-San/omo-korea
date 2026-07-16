import { useEffect, useMemo, useState } from "react";
import { api } from "@/api";
import type {
  CourseType,
  GraduationProgress,
  RecommendedCourse,
  Enrollment,
} from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { GraduationCard } from "@/components/graduation/GraduationCard";
import {
  Calendar,
  List,
  Plus,
  Trash2,
  AlertTriangle,
  BookOpen,
  Check,
  Clock,
  RefreshCw,
  Info,
  Download,
} from "lucide-react";
import { exportTimetableToIcs } from "@/utils/icsExporter";

interface TimeSlot {
  day: number; // 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri
  dayLabel: string;
  start: string;
  end: string;
}

// Consistent mock schedules assigned to course IDs for timetable mapping
const COURSE_SCHEDULES: Record<number, TimeSlot[]> = {
  1: [
    { day: 1, dayLabel: "Mon", start: "09:00", end: "10:30" },
    { day: 3, dayLabel: "Wed", start: "09:00", end: "10:30" },
  ],
  2: [
    { day: 1, dayLabel: "Mon", start: "10:30", end: "12:00" },
    { day: 3, dayLabel: "Wed", start: "10:30", end: "12:00" },
  ],
  3: [
    { day: 2, dayLabel: "Tue", start: "09:00", end: "10:30" },
    { day: 4, dayLabel: "Thu", start: "09:00", end: "10:30" },
  ],
  4: [
    { day: 2, dayLabel: "Tue", start: "10:30", end: "12:00" },
    { day: 4, dayLabel: "Thu", start: "10:30", end: "12:00" },
  ],
  5: [
    { day: 1, dayLabel: "Mon", start: "13:00", end: "14:30" },
    { day: 3, dayLabel: "Wed", start: "13:00", end: "14:30" },
  ],
  6: [
    { day: 2, dayLabel: "Tue", start: "13:00", end: "14:30" },
    { day: 4, dayLabel: "Thu", start: "13:00", end: "14:30" },
  ],
  7: [
    { day: 1, dayLabel: "Mon", start: "14:30", end: "16:00" },
    { day: 3, dayLabel: "Wed", start: "14:30", end: "16:00" },
  ],
  8: [
    { day: 2, dayLabel: "Tue", start: "14:30", end: "16:00" },
    { day: 4, dayLabel: "Thu", start: "14:30", end: "16:00" },
  ],
  9: [{ day: 5, dayLabel: "Fri", start: "09:00", end: "12:00" }],
  10: [{ day: 5, dayLabel: "Fri", start: "13:00", end: "16:00" }],
  11: [{ day: 3, dayLabel: "Wed", start: "16:00", end: "17:30" }],
  12: [{ day: 4, dayLabel: "Thu", start: "16:00", end: "17:30" }],
};
import { slotsOverlap } from "@/utils/timetable";

export function AcademicPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [viewTab, setViewTab] = useState<"CURRICULUM" | "TIMETABLE">(
    "CURRICULUM",
  );
  const [allFilter, setAllFilter] = useState<CourseType | "ALL">("ALL");
  const [allCourses, setAllCourses] = useState<RecommendedCourse[]>([]);
  const [progress, setProgress] = useState<GraduationProgress | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [collisionError, setCollisionError] = useState<string | null>(null);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(1); // 1: Mon, ..., 5: Fri

  // Fetch initial loads
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [courses, graduation, timetable] = await Promise.all([
        api.getRecommendedCourses("ALL"),
        api.getGraduationProgress(),
        api.getEnrollments(user.studentId),
      ]);
      setAllCourses(courses);
      setProgress(graduation);
      setEnrollments(timetable);
    } catch (err: any) {
      setError(err.message || t("academic.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredAllCourses = useMemo(() => {
    if (allFilter === "ALL") return allCourses;
    return allCourses.filter((course) => course.type === allFilter);
  }, [allCourses, allFilter]);

  // Timetable overlap verification before adding a class
  const handleAddToTimetable = async (course: RecommendedCourse) => {
    if (!user) return;
    setCollisionError(null);
    setSubmittingId(Number(course.id));

    const newSlots = COURSE_SCHEDULES[Number(course.id)] || [];

    // Check conflicts against already enrolled courses
    let conflictFound = false;
    let conflictingCourseName = "";

    for (const enrollment of enrollments) {
      const existingSlots =
        COURSE_SCHEDULES[Number(enrollment.course_id)] || [];
      for (const newSlot of newSlots) {
        for (const existingSlot of existingSlots) {
          if (slotsOverlap(newSlot, existingSlot)) {
            conflictFound = true;
            conflictingCourseName = enrollment.course_name || "Enrolled Course";
            break;
          }
        }
        if (conflictFound) break;
      }
      if (conflictFound) break;
    }

    if (conflictFound) {
      setCollisionError(
        `${t("academic.conflictMessage")} (Overlaps with: ${conflictingCourseName})`,
      );
      setSubmittingId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const newEnrollment = await api.createEnrollment(
        user.studentId,
        Number(course.id),
      );
      setEnrollments((prev) => [...prev, newEnrollment]);
    } catch (err: any) {
      setCollisionError(err.message || "Failed to add course.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDropFromTimetable = async (enrollmentId: number) => {
    if (!window.confirm(t("academic.confirmDrop"))) return;
    setLoading(true);
    try {
      await api.deleteEnrollment(enrollmentId);
      setEnrollments((prev) =>
        prev.filter((e) => e.enrollment_id !== enrollmentId),
      );
    } catch (err: any) {
      setError(err.message || "Failed to drop course.");
    } finally {
      setLoading(false);
    }
  };

  const totalTimetableCredits = useMemo(() => {
    return enrollments.reduce((sum, e) => sum + (e.credit || 0), 0);
  }, [enrollments]);

  // Get courses scheduled for the active day tab
  const daySchedule = useMemo(() => {
    const list: { enrollment: Enrollment; slot: TimeSlot }[] = [];

    enrollments.forEach((enrollment) => {
      const slots = COURSE_SCHEDULES[Number(enrollment.course_id)] || [];
      slots.forEach((slot) => {
        if (slot.day === selectedDayTab) {
          list.push({ enrollment, slot });
        }
      });
    });

    // Sort chronologically by start time
    return list.sort((a, b) => a.slot.start.localeCompare(b.slot.start));
  }, [enrollments, selectedDayTab]);

  const profileIncomplete = !user?.major;
  const isEnrolled = (courseId: string) =>
    enrollments.some((e) => Number(e.course_id) === Number(courseId));

  return (
    <div className="pb-8">
      <PageHeader
        title={t("academic.title")}
        subtitle={t("academic.subtitle")}
      />

      {/* Segmented View Switcher */}
      <div className="px-5 mt-4">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewTab("CURRICULUM")}
            className={`flex-grow py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              viewTab === "CURRICULUM"
                ? "bg-white text-pnu-text shadow-sm"
                : "text-pnu-muted hover:text-pnu-text"
            }`}
          >
            <List className="w-4 h-4" />
            {t("academic.curriculum")}
          </button>
          <button
            onClick={() => setViewTab("TIMETABLE")}
            className={`flex-grow py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              viewTab === "TIMETABLE"
                ? "bg-white text-pnu-text shadow-sm"
                : "text-pnu-muted hover:text-pnu-text"
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t("academic.timetable")}
          </button>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {profileIncomplete ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2.5">
            <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <span>{t("academic.profileIncomplete")}</span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {collisionError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm text-rose-700 flex items-start gap-2.5 animate-bounce-short">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{t("academic.conflictTitle")}</p>
              <p className="mt-0.5 text-xs text-rose-600 font-medium">
                {collisionError}
              </p>
            </div>
            <button
              onClick={() => setCollisionError(null)}
              className="text-xs font-semibold text-rose-800 hover:text-rose-900 border border-rose-300 rounded px-1.5 py-0.5 transition-colors"
            >
              Clear
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-pnu-muted gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-pnu-blue" />
            <p className="text-sm font-medium">{t("academic.loading")}</p>
          </div>
        ) : null}

        {!loading && viewTab === "CURRICULUM" && (
          <div className="space-y-6">
            {/* Credit progress component */}
            {progress && (
              <section className="bg-white border border-pnu-border rounded-2xl p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-pnu-text">
                  {t("academic.completedCredits")}
                </h3>
                <GraduationCard progress={progress} />
              </section>
            )}

            {/* Courses section */}
            <section className="space-y-4">
              <h3 className="text-base font-bold text-pnu-text tracking-tight">
                {t("academic.allCourses")}
              </h3>
              <CourseFilters value={allFilter} onChange={setAllFilter} />

              {filteredAllCourses.length === 0 && (
                <p className="text-sm text-pnu-muted py-4">
                  {t("academic.noCourses")}
                </p>
              )}

              <div className="space-y-3.5">
                {filteredAllCourses.map((course) => {
                  const enrolled = isEnrolled(course.id);
                  return (
                    <CourseCard
                      key={`all-${course.id}`}
                      course={course}
                      action={
                        enrolled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100/60">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            {t("academic.enrolled")}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToTimetable(course)}
                            disabled={submittingId === Number(course.id)}
                            className="bg-pnu-blue hover:bg-pnu-blue-light disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 text-xs font-bold"
                          >
                            <Plus className="w-4 h-4" />
                            {t("academic.addToTimetable")}
                          </button>
                        )
                      }
                    />
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {!loading && viewTab === "TIMETABLE" && (
          <div className="space-y-5">
            {/* Credits load indicator & ICS download */}
            <div className="flex flex-col gap-3">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl text-slate-100 flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Timetable Overview
                  </span>
                  <h4 className="text-sm font-bold">
                    {t("academic.creditsHeader", {
                      credits: totalTimetableCredits,
                    })}
                  </h4>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              {enrollments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    exportTimetableToIcs(enrollments);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-xs border border-indigo-500/30"
                >
                  <Download className="w-4 h-4" />
                  {t("academic.downloadIcs")}
                </button>
              )}
            </div>

            {/* Daily schedule grid tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold select-none">
              {[
                { day: 1, label: "Mon" },
                { day: 2, label: "Tue" },
                { day: 3, label: "Wed" },
                { day: 4, label: "Thu" },
                { day: 5, label: "Fri" },
              ].map((d) => (
                <button
                  key={d.day}
                  onClick={() => setSelectedDayTab(d.day)}
                  className={`flex-grow py-2 px-1 rounded-lg transition-all text-center ${
                    selectedDayTab === d.day
                      ? "bg-white text-pnu-text shadow-sm"
                      : "text-pnu-muted hover:text-pnu-text"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Day chronological timeline */}
            <div className="space-y-4 mt-2">
              {daySchedule.length === 0 ? (
                <div className="border border-dashed border-pnu-border rounded-2xl p-8 flex flex-col items-center justify-center text-pnu-muted gap-2 bg-slate-50/50">
                  <Calendar className="w-8 h-8 text-pnu-muted/60" />
                  <p className="text-xs font-medium">
                    No classes scheduled for this day.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {daySchedule.map(({ enrollment, slot }) => (
                    <div
                      key={`${enrollment.enrollment_id}-${slot.day}`}
                      className="border border-pnu-border bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-pnu-blue font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {slot.start} - {slot.end}
                          </span>
                          <span className="text-pnu-muted font-normal">•</span>
                          <span className="text-[10px] text-pnu-muted font-semibold bg-pnu-surface px-1.5 py-0.5 rounded border border-pnu-border uppercase">
                            {enrollment.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-pnu-text leading-snug">
                          {enrollment.course_name}
                        </h4>
                        <p className="text-[10px] text-pnu-muted font-semibold">
                          {enrollment.credit} credits
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleDropFromTimetable(enrollment.enrollment_id)
                        }
                        className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-rose-100"
                        title={t("academic.dropCourse")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
