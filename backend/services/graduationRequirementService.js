/**
 * Read major catalog rows from `graduation_requirement` and per-student
 * status from `student_graduation_requirement`. Never store these in checklist_item.
 */

/** CS checklist_item task names that must be migrated out of checklist_item. */
const LEGACY_CHECKLIST_TASK_NAMES = new Set([
  "TOPIK Level 4 or higher",
  "TOPCIT 22 or 2 major electives",
  "PCCP 300 or Computer Algorithm Practice",
  "Graduation Project",
]);

function isCsGraduationTaskName(taskName) {
  return LEGACY_CHECKLIST_TASK_NAMES.has(String(taskName || "").trim());
}


function mapRequirementForApi(catalogRow, statusRow) {
  const status = statusRow?.status || "Not Started";
  return {
    requirement_id: catalogRow.req_id,
    req_id: catalogRow.req_id,
    student_id: statusRow?.student_id ?? null,
    requirement_code: catalogRow.requirement_code,
    task_name: catalogRow.requirement_name,
    title: catalogRow.requirement_name,
    description: catalogRow.description ?? null,
    requirement_type: catalogRow.requirement_type,
    target_value: catalogRow.target_value,
    unit: catalogRow.unit,
    status,
    created_at: statusRow?.updated_at ?? null,
  };
}

async function removeLegacyChecklistGraduationTasks(supabase, studentId) {
  const { data: rows, error } = await supabase
    .from("checklist_item")
    .select("checklist_id, task_name")
    .eq("student_id", studentId);

  if (error || !rows?.length) return;

  const ids = rows
    .filter((row) => isCsGraduationTaskName(row.task_name))
    .map((row) => row.checklist_id)
    .filter((id) => id != null);

  if (ids.length === 0) return;

  const { error: deleteError } = await supabase
    .from("checklist_item")
    .delete()
    .in("checklist_id", ids);

  if (deleteError) {
    console.warn(
      "Failed to remove legacy graduation checklist_item rows:",
      deleteError.message || deleteError,
    );
  }
}

/**
 * Ensure student has status rows for major milestone requirements, return API rows.
 */
async function ensureGraduationRequirements(supabase, studentId, majorId) {
  await removeLegacyChecklistGraduationTasks(supabase, studentId);

  if (majorId == null || majorId === "") {
    return [];
  }

  const { data: catalog, error: catalogError } = await supabase
    .from("graduation_requirement")
    .select("*")
    .eq("major_id", majorId)
    .order("display_order", { ascending: true });

  if (catalogError) {
    const err = new Error(
      catalogError.message || "Failed to fetch graduation_requirement",
    );
    err.code = catalogError.code;
    throw err;
  }

  const milestones = (catalog || []);
  if (milestones.length === 0) return [];

  let { data: statusRows, error: statusError } = await supabase
    .from("student_graduation_requirement")
    .select("*")
    .eq("student_id", studentId);

  if (statusError) {
    // Progress table not migrated yet — still return catalog as Not Started.
    console.warn(
      "student_graduation_requirement unavailable:",
      statusError.message || statusError,
    );
    return milestones.map((row) => mapRequirementForApi(row, null));
  }

  statusRows = statusRows || [];
  const byReqId = new Map(statusRows.map((row) => [Number(row.req_id), row]));

  const missing = milestones.filter((row) => !byReqId.has(Number(row.req_id)));
  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("student_graduation_requirement")
      .insert(
        missing.map((row) => ({
          student_id: studentId,
          req_id: row.req_id,
          status: "Not Started",
        })),
      )
      .select();

    if (insertError) {
      console.warn(
        "student_graduation_requirement seed failed:",
        insertError.message || insertError,
      );
    } else {
      for (const row of inserted || []) {
        byReqId.set(Number(row.req_id), row);
      }
    }
  }

  return milestones.map((row) =>
    mapRequirementForApi(row, byReqId.get(Number(row.req_id)) || null),
  );
}

async function updateStudentGraduationRequirement(
  supabase,
  studentId,
  reqId,
  status,
) {
  const payload = {
    student_id: studentId,
    req_id: reqId,
    status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("student_graduation_requirement")
    .upsert(payload, { onConflict: "student_id,req_id" })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message || "Failed to update requirement status");
    err.code = error.code;
    throw err;
  }

  const { data: catalog, error: catalogError } = await supabase
    .from("graduation_requirement")
    .select("*")
    .eq("req_id", reqId)
    .single();

  if (catalogError || !catalog) {
    return {
      requirement_id: reqId,
      req_id: reqId,
      task_name: "",
      title: "",
      description: null,
      status: data.status,
    };
  }

  return mapRequirementForApi(catalog, data);
}

module.exports = {
  LEGACY_CHECKLIST_TASK_NAMES,
  isCsGraduationTaskName,
  ensureGraduationRequirements,
  updateStudentGraduationRequirement,
  removeLegacyChecklistGraduationTasks,
};
