import type { CourseType } from "@/types/api";
import { useLanguage } from "@/context/LanguageContext";

const filters: { value: CourseType | "ALL"; key: string }[] = [
  { value: "ALL", key: "courseFilter.all" },
  { value: "전공", key: "courseFilter.major" },
  { value: "효원핵심교양", key: "courseFilter.hyowonCore" },
  { value: "효원균형교양", key: "courseFilter.hyowonBalanced" },
  { value: "효원창의교양", key: "courseFilter.hyowonCreative" },
  { value: "일반선택", key: "courseFilter.generalElective" },
];

interface CourseFiltersProps {
  value: CourseType | "ALL";
  onChange: (value: CourseType | "ALL") => void;
}

export function CourseFilters({ value, onChange }: CourseFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => {
        const active = value === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={[
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-pnu-blue text-white shadow-sm"
                : "border border-pnu-border bg-white text-pnu-muted hover:text-pnu-text",
            ].join(" ")}
          >
            {t(filter.key)}
          </button>
        );
      })}
    </div>
  );
}
