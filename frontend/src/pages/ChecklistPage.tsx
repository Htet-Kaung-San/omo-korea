import { useEffect, useState } from "react";
import { api } from "@/api";
import type {
  ChecklistItem,
  ChecklistVariant,
  GraduationProgress,
} from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChecklistRow } from "@/components/checklist/ChecklistRow";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// ── Credit-gate helpers ───────────────────────────────────────────────────────

/**
 * Given a checklist item and the current graduation progress, return whether
 * the item is locked (credit requirement not yet satisfied).
 */
function isItemLocked(
  item: ChecklistItem,
  progress: GraduationProgress | null,
): boolean {
  if (!item.creditRequirement || !progress) return false;
  const { category } = item.creditRequirement;
  const required =
    category === "total"
      ? progress.totalRequired
      : progress.breakdown[category].required;

  const completed =
    category === "total"
      ? progress.totalCompleted
      : progress.breakdown[category].completed;

  return completed < required;
}

/**
 * Build a human-readable reason why the item is still locked.
 */
function getLockReason(
  item: ChecklistItem,
  progress: GraduationProgress | null,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (!item.creditRequirement || !progress) return "";

  const { category } = item.creditRequirement;

  const labels: Record<string, string> = {
    generalRequired: "교양필수",
    generalElective: "교양선택",
    majorBasic: "전공기초",
    majorRequired: "전공필수",
    majorElective: "전공선택",
    generalFree: "일반선택",
  };

  const required =
    category === "total"
      ? progress.totalRequired
      : progress.breakdown[category].required;

  const completed =
    category === "total"
      ? progress.totalCompleted
      : progress.breakdown[category].completed;

  const remaining = Math.max(required - completed, 0);

  if (category === "total") {
    return t("checklist.lockReasonTotal", { required, completed, remaining });
  }

  const label = labels[category] ?? category;

  return t("checklist.lockReasonCategory", {
    required,
    label,
    completed,
    remaining,
  });
}

// ── ChecklistPage ─────────────────────────────────────────────────────────────

export function ChecklistPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [variant, setVariant] = useState<ChecklistVariant>(
    "GRADUATION_REQUIREMENT",
  );
  const [progress, setProgress] = useState<GraduationProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isFreshmanChecklist = variant === "NEW_STUDENT";

  useEffect(() => {
    Promise.all([api.getChecklist(), api.getGraduationProgress()])
      .then(([payload, grad]) => {
        setItems(payload.items);
        setVariant(payload.variant);
        setProgress(grad);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t("checklist.loadError")),
      )
      .finally(() => setLoading(false));
  }, [t]);

  async function handleToggle(id: string, completed: boolean) {
    setUpdatingId(id);
    setError("");
    try {
      const updated = await api.updateChecklistItem(id, completed);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("checklist.updateError"));
    } finally {
      setUpdatingId(null);
    }
  }

  const completedCount = items.filter((i) => i.completed).length;
  const lockedCount = items.filter((i) => isItemLocked(i, progress)).length;

  return (
    <div>
      <PageHeader
        title={
          isFreshmanChecklist
            ? t("checklist.titleFreshman")
            : t("checklist.titleGraduation")
        }
        subtitle={
          isFreshmanChecklist
            ? t("checklist.subtitleFreshman")
            : t("checklist.subtitleGraduation")
        }
      />

      <div className="space-y-4 px-5 py-5">
        {/* Overall progress bar */}
        {!loading && items.length > 0 ? (
          <div className="rounded-2xl border border-pnu-border bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-pnu-text">Progress</span>
              <span className="text-pnu-muted">
                {t("common.completedCount", {
                  completed: completedCount,
                  total: items.length,
                })}
              </span>
            </div>
            <ProgressBar value={completedCount} max={items.length} />

            {/* Lock summary — only shown for graduation checklist */}
            {!isFreshmanChecklist && lockedCount > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <p className="text-[12px] text-amber-700">
                  <span className="font-semibold">
                    {t("checklist.lockedItems", {
                      count: lockedCount,
                      suffix: lockedCount > 1 ? "s" : "",
                    })}
                  </span>{" "}
                  {t("checklist.lockedHint")}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Credit gate legend — only for graduation checklist */}
        {!isFreshmanChecklist && progress && !loading && (
          <div className="rounded-2xl border border-dashed border-pnu-border bg-white/70 px-4 py-3 text-[12px] text-pnu-muted leading-relaxed">
            <p className="font-semibold text-pnu-text mb-1">
              {t("checklist.creditCompleted")}{" "}
              <span className="text-pnu-blue-light">
                {progress.totalCompleted}
              </span>
              <span className="text-pnu-muted">
                {" "}
                / {progress.totalRequired}
              </span>
            </p>
            <p>{t("checklist.lockLegend")}</p>
          </div>
        )}

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-pnu-muted">{t("checklist.loading")}</p>
        ) : null}

        <div className="space-y-3">
          {items.map((item) => {
            const locked = isItemLocked(item, progress);
            const lockReason = locked
              ? getLockReason(item, progress, t)
              : undefined;
            return (
              <ChecklistRow
                key={item.id}
                item={item}
                disabled={updatingId === item.id}
                locked={locked}
                lockReason={lockReason}
                onToggle={handleToggle}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
