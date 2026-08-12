/**
 * checklist_item = shared catalog only:
 *   checklist_id, task_name (name), target_semester
 *
 * student_checklist_status = per-student completion
 *
 * student.grade: 0 = exchange, 1..4 = year. Checklist for grade 0 or 1 only.
 */

const CURRENT_CHECKLIST_SEMESTER = "2026";

const BUILTIN_TASKS = [
  "Apply for Alien Registration Card (ARC)",
  "Open Local Korean Bank Account",
  "Register and Open Mobile SIM Card",
  "Submit Health Clearance Certificate to Dormitory",
];

/** @param {unknown} grade */
function normalizeGrade(grade) {
  if (grade === null || grade === undefined || grade === "") return null;
  const n = Number(grade);
  return Number.isFinite(n) ? n : null;
}

/** @param {unknown} grade */
function shouldShowChecklist(grade) {
  const n = normalizeGrade(grade);
  return n === 0 || n === 1;
}

/**
 * @param {string|number} yearChoice '1'|'2'|'3'|'4'|'exchange'|number
 */
function gradeFromYearChoice(yearChoice) {
  const raw = String(yearChoice || "")
    .trim()
    .toLowerCase();
  if (raw === "exchange") return 0;
  const n = Number(raw);
  if (n >= 1 && n <= 4) return n;
  return null;
}

function studentTypeFromGrade(grade) {
  const n = normalizeGrade(grade);
  if (n === 1 || n === 0) return "Freshman";
  if (n === 2 || n === 3 || n === 4) return "Current";
  return "Current";
}

async function loadCatalog(supabase, semester) {
  // Shared catalog — no student_id filter.
  const { data, error } = await supabase
    .from("checklist_item")
    .select("checklist_id, task_name, target_semester")
    .eq("target_semester", semester)
    .order("checklist_id", { ascending: true });

  if (error) {
    // Legacy per-student table still has student_id — read distinct names only.
    const legacy = await supabase
      .from("checklist_item")
      .select("checklist_id, task_name, target_semester, student_id")
      .eq("target_semester", semester)
      .limit(200);

    if (legacy.error || !legacy.data?.length) {
      console.warn(
        "checklist_item catalog unavailable, using builtin:",
        error.message || legacy.error?.message || error,
      );
      return BUILTIN_TASKS.map((task_name, index) => ({
        checklist_id: index + 1,
        task_name,
        target_semester: semester,
        _builtin: true,
      }));
    }

    // Deduplicate by task_name (keep lowest checklist_id)
    const byName = new Map();
    for (const row of legacy.data) {
      const key = String(row.task_name || "").trim();
      if (!key) continue;
      const prev = byName.get(key);
      if (!prev || Number(row.checklist_id) < Number(prev.checklist_id)) {
        byName.set(key, row);
      }
    }
    return [...byName.values()].map((row) => ({
      checklist_id: row.checklist_id,
      task_name: row.task_name,
      target_semester: row.target_semester || semester,
      _legacy: true,
    }));
  }

  if (!data || data.length === 0) {
    // Seed shared catalog once for this semester
    const { data: seeded, error: seedError } = await supabase
      .from("checklist_item")
      .insert(
        BUILTIN_TASKS.map((task_name) => ({
          task_name,
          target_semester: semester,
        })),
      )
      .select("checklist_id, task_name, target_semester");

    if (seedError || !seeded?.length) {
      return BUILTIN_TASKS.map((task_name, index) => ({
        checklist_id: index + 1,
        task_name,
        target_semester: semester,
        _builtin: true,
      }));
    }
    return seeded;
  }

  return data.map((row) => ({
    checklist_id: row.checklist_id,
    task_name: row.task_name,
    target_semester: row.target_semester || semester,
  }));
}

async function loadStudentStatuses(supabase, studentId, checklistIds) {
  if (!checklistIds.length) return new Map();

  const { data, error } = await supabase
    .from("student_checklist_status")
    .select("*")
    .eq("student_id", studentId)
    .in("checklist_id", checklistIds);

  if (error) {
    console.warn(
      "student_checklist_status unavailable:",
      error.message || error,
    );
    return new Map();
  }

  return new Map((data || []).map((row) => [Number(row.checklist_id), row]));
}

async function ensureStudentStatuses(supabase, studentId, catalog) {
  const ids = catalog
    .filter((row) => !row._builtin)
    .map((row) => Number(row.checklist_id))
    .filter((id) => Number.isFinite(id));

  let statusById = await loadStudentStatuses(supabase, studentId, ids);

  const missing = ids.filter((id) => !statusById.has(id));
  if (missing.length === 0) return statusById;

  const { data: inserted, error } = await supabase
    .from("student_checklist_status")
    .insert(
      missing.map((checklist_id) => ({
        student_id: studentId,
        checklist_id,
        status: "Not Started",
      })),
    )
    .select();

  if (error) {
    console.warn(
      "student_checklist_status seed failed:",
      error.message || error,
    );
    return statusById;
  }

  for (const row of inserted || []) {
    statusById.set(Number(row.checklist_id), row);
  }
  return statusById;
}

/**
 * Fallback when status table is missing: read legacy checklist_item.student_id rows.
 */
async function loadLegacyStatusesByName(supabase, studentId) {
  const { data, error } = await supabase
    .from("checklist_item")
    .select("*")
    .eq("student_id", studentId);

  if (error || !data) return new Map();
  return new Map(data.map((row) => [String(row.task_name), row]));
}

async function getChecklistForStudent(supabase, studentId, grade) {
  if (!shouldShowChecklist(grade)) {
    return {
      eligible: false,
      semester: CURRENT_CHECKLIST_SEMESTER,
      items: [],
    };
  }

  const catalog = await loadCatalog(supabase, CURRENT_CHECKLIST_SEMESTER);
  const usingSharedIds = catalog.every((row) => !row._builtin);

  let statusById = new Map();
  let legacyByName = new Map();

  if (usingSharedIds) {
    statusById = await ensureStudentStatuses(supabase, studentId, catalog);
  }

  if (statusById.size === 0) {
    legacyByName = await loadLegacyStatusesByName(supabase, studentId);
  }

  const items = catalog.map((row) => {
    const statusRow =
      statusById.get(Number(row.checklist_id)) ||
      legacyByName.get(String(row.task_name)) ||
      null;

    return {
      checklist_id: row.checklist_id,
      student_id: studentId,
      task_name: row.task_name,
      title: row.task_name,
      description: null,
      status: statusRow?.status || "Not Started",
      target_semester: row.target_semester || CURRENT_CHECKLIST_SEMESTER,
      created_at: statusRow?.updated_at || statusRow?.created_at || null,
    };
  });

  return {
    eligible: true,
    semester: CURRENT_CHECKLIST_SEMESTER,
    items,
  };
}

/**
 * Update completion for the authenticated student against a shared checklist_id.
 */
async function updateStudentChecklistStatus(
  supabase,
  studentId,
  checklistId,
  status,
) {
  // Prefer dedicated status table
  const upsert = await supabase
    .from("student_checklist_status")
    .upsert(
      {
        student_id: studentId,
        checklist_id: checklistId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,checklist_id" },
    )
    .select()
    .single();

  if (!upsert.error && upsert.data) {
    const { data: catalog } = await supabase
      .from("checklist_item")
      .select("checklist_id, task_name, target_semester")
      .eq("checklist_id", checklistId)
      .maybeSingle();

    return {
      checklist_id: checklistId,
      student_id: studentId,
      task_name: catalog?.task_name || "",
      title: catalog?.task_name || "",
      description: null,
      status: upsert.data.status,
      target_semester: catalog?.target_semester || CURRENT_CHECKLIST_SEMESTER,
    };
  }

  // Legacy: per-student checklist_item row
  const legacy = await supabase
    .from("checklist_item")
    .update({ status })
    .eq("checklist_id", checklistId)
    .eq("student_id", studentId)
    .select()
    .maybeSingle();

  if (legacy.error || !legacy.data) {
    // Last resort: update by id only (old schema)
    const byId = await supabase
      .from("checklist_item")
      .update({ status })
      .eq("checklist_id", checklistId)
      .select()
      .maybeSingle();

    if (byId.error || !byId.data) {
      const err = new Error(
        upsert.error?.message ||
          legacy.error?.message ||
          byId.error?.message ||
          "Failed to update checklist status",
      );
      throw err;
    }
    return byId.data;
  }

  return legacy.data;
}

module.exports = {
  CURRENT_CHECKLIST_SEMESTER,
  BUILTIN_TASKS,
  normalizeGrade,
  shouldShowChecklist,
  gradeFromYearChoice,
  studentTypeFromGrade,
  getChecklistForStudent,
  updateStudentChecklistStatus,
};
