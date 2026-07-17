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
import { COURSE_SCHEDULES, type ScheduledSlot } from "@/data/courseSchedules";
import { slotsOverlap } from "@/utils/timetable";

export function AcademicPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [viewTab, setViewTab] = useState<"CURRICULUM" | "TIMETABLE">(
    "TIMETABLE",
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
    const list: { enrollment: Enrollment; slot: ScheduledSlot }[] = [];

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
        title={t("nav.schedule")}
        subtitle={t("academic.subtitle")}
      />

      {/* Segmented View Switcher — iOS style */}
      <div className="px-4 mt-3">
        <div className="flex rounded-[12px] bg-[#E5E5EA] p-1">
          <button
            onClick={() => setViewTab("TIMETABLE")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] py-2 text-[13px] font-semibold transition-all ${
              viewTab === "TIMETABLE"
                ? "bg-white text-pnu-text shadow-sm"
                : "text-pnu-muted"
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t("academic.timetable")}
          </button>
          <button
            onClick={() => setViewTab("CURRICULUM")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] py-2 text-[13px] font-semibold transition-all ${
              viewTab === "CURRICULUM"
                ? "bg-white text-pnu-text shadow-sm"
                : "text-pnu-muted"
            }`}
          >
            <List className="w-4 h-4" />
            {t("academic.curriculum")}
          </button>
        </div>
      </div>

      <div className="space-y-5 px-4 py-4">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div>
                <p className="text-[12px] font-medium text-pnu-muted">
                  {t("academic.timetable")}
                </p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-pnu-text">
                  {t("academic.creditsHeader", {
                    credits: totalTimetableCredits,
                  })}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pnu-blue/10 text-pnu-blue">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            {enrollments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  exportTimetableToIcs(enrollments);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-pnu-blue py-3 text-[13px] font-semibold text-white shadow-sm active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                {t("academic.downloadIcs")}
              </button>
            )}

            <div className="flex rounded-[12px] bg-[#E5E5EA] p-1 text-[12px] font-semibold">
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
                  className={`flex-1 rounded-[10px] py-2 text-center transition-all ${
                    selectedDayTab === d.day
                      ? "bg-white text-pnu-text shadow-sm"
                      : "text-pnu-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {daySchedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] bg-white px-6 py-10 text-pnu-muted shadow-sm ring-1 ring-black/5">
                  <Calendar className="h-8 w-8 opacity-50" />
                  <p className="text-[13px] font-medium">
                    No classes scheduled for this day.
                  </p>
                </div>
              ) : (
                daySchedule.map(({ enrollment, slot }, index) => {
                  const tones = [
                    "border-l-[#005BAC]",
                    "border-l-[#34C759]",
                    "border-l-[#FF9500]",
                    "border-l-[#AF52DE]",
                    "border-l-[#FF2D55]",
                  ];
                  return (
                    <div
                      key={`${enrollment.enrollment_id}-${slot.day}-${slot.start}`}
                      className={`flex items-start justify-between gap-3 rounded-[18px] border-l-4 bg-white p-4 shadow-sm ring-1 ring-black/5 ${tones[index % tones.length]}`}
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-pnu-blue">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {slot.start} – {slot.end}
                          </span>
                        </div>
                        <h4 className="text-[15px] font-semibold leading-snug text-pnu-text">
                          {enrollment.course_name}
                        </h4>
                        <p className="text-[12px] text-pnu-muted">
                          {enrollment.classroom || `${enrollment.credit ?? 0} credits`}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleDropFromTimetable(enrollment.enrollment_id)
                        }
                        className="rounded-full bg-[#F2F2F7] p-2 text-[#FF3B30] transition active:scale-95"
                        title={t("academic.dropCourse")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
