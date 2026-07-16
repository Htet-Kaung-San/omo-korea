import type { RecommendedCourse } from "@/types/api";
import { CourseTypeBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { Sparkles, BookOpen } from "lucide-react";

export function CourseCard({
  course,
  action,
}: {
  course: RecommendedCourse;
  action?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const matchScore = course.score || 90;

  return (
    <Card className="hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-[0.99] duration-200 border-l-4 border-l-pnu-blue">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-pnu-blue bg-pnu-blue/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5 text-pnu-blue" />
              {matchScore}% Match
            </span>
            <CourseTypeBadge type={course.type} />
          </div>
          <h4 className="mt-2 text-base font-bold text-pnu-text tracking-tight leading-tight">
            {course.nameKo}
          </h4>
          <p className="text-xs font-medium text-pnu-muted mt-0.5">
            {course.nameEn}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {course.tags && course.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {course.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-semibold text-pnu-muted bg-pnu-surface border border-pnu-border px-2 py-0.5 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-pnu-border pt-3 text-xs text-pnu-muted">
        <div className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5 text-pnu-muted" />
          <span>{t("course.credits", { count: course.credits })}</span>
        </div>
        <span className="truncate max-w-[60%] font-medium">
          {course.department}
        </span>
      </div>

      {course.matchHint ? (
        <div className="mt-3 rounded-xl bg-pnu-blue/5 border border-pnu-blue/10 px-2.5 py-2">
          <p className="text-[10.5px] font-medium text-pnu-blue leading-normal flex items-start gap-1">
            <span className="text-amber-500">💡</span>
            <span className="flex-1">{course.matchHint}</span>
          </p>
        </div>
      ) : null}
    </Card>
  );
}
