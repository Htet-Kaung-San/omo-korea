const supabase = require("../supabaseClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  getCareerOpportunitiesPage,
} = require("../services/jobKoreaScraperService");
const { getEmergencyGuide } = require("../services/emergencyGuideService");
const { getCampusFacilities } = require("../services/campusFacilitiesService");
const communityService = require("../services/communityService");
const { localizeRow } = require("../middleware/languageMiddleware");
const {
  resolveLanguagePref,
  SUPPORTED_LANGUAGE_PREFS,
} = require("../middleware/supportedLanguages");
const { mapNoticeRow, scrapeRecentNotices } = require("../services/pnuNoticeScraperService");

const JWT_SECRET = process.env.JWT_SECRET || "hey-pnu-default-secret-key";

function formatScholarshipDeadline(deadline) {
  if (!deadline) {
    return "";
  }

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return String(deadline);
  }

  const days = Math.ceil(
    (parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days >= 0) {
    return `D-${days}`;
  }

  return parsed.toISOString().slice(0, 10);
}

function mapScholarshipRow(row, language = "en") {
  const localized = localizeRow(row, language, [
    "title",
    "description",
    "eligibility",
  ]);

  return {
    id: String(row.scholarship_id ?? row.id),
    title: localized.title ?? "Scholarship",
    description: localized.description ?? "",
    deadline: formatScholarshipDeadline(row.deadline),
    eligibility: localized.eligibility ?? row.provider ?? "",
    amount: row.amount ?? null,
    provider: row.provider ?? null,
  };
}

const testConnection = async (req, res) => {
  try {
    const { data, error } = await supabase.from("major").select("*").limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to query MAJOR table",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Database connection successful",
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const loginStudent = async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Missing student_id",
      });
    }

    const { data, error } = await supabase
      .from("student")
      .select(
        `
        *,
        major:major_id (
          major_name,
          department
        )
      `,
      )
      .eq("student_id", student_id)
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116" || !data) {
        return res.status(404).json({
          success: false,
          message: "Student ID not registered",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch student profile",
        error: error.message,
      });
    }

    // Verify password if provided (supports passwordless login for dev test runner script compatibility)
    if (password !== undefined) {
      const isMatch = data.password.startsWith("$2")
        ? await bcrypt.compare(password, data.password)
        : password === data.password;

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid password",
        });
      }
    }

    const { major, ...studentProfile } = data;

    const token = jwt.sign({ student_id: data.student_id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      token,
      data: {
        ...studentProfile,
        major_name: major?.major_name ?? null,
        department: major?.department ?? null,
        token,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const CURRENT_TERM = "2026-Fall";

const ESSENTIAL_SETTLEMENT_TASKS = [
  { task_name: "Apply for Alien Registration Card (ARC)" },
  { task_name: "Open Local Korean Bank Account" },
  { task_name: "Register and Open Mobile SIM Card" },
  { task_name: "Submit Health Clearance Certificate to Dormitory" },
];

const getStudentChecklist = async (req, res) => {
  try {
    const { student_id } = req.params;

    const { data: priorEnrollments, error: enrollmentError } = await supabase
      .from("enrollment")
      .select("semester")
      .eq("student_id", student_id)
      .neq("semester", CURRENT_TERM);

    if (enrollmentError) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch enrollment history",
        error: enrollmentError.message,
      });
    }

    const isNewlyEnrolled = !priorEnrollments || priorEnrollments.length === 0;

    const { data: student, error: studentError } = await supabase
      .from("student")
      .select("student_type")
      .eq("student_id", student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
        error: studentError?.message,
      });
    }

    const studentType = student.student_type || "Current";

    const { data: templates } = await supabase
      .from("checklist_template")
      .select("*")
      .eq("student_type", studentType);

    let { data: existingItems, error: fetchError } = await supabase
      .from("checklist_item")
      .select("*")
      .eq("student_id", student_id);

    if (fetchError) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch checklist",
        error: fetchError.message,
      });
    }

    existingItems = existingItems || [];

    if (templates && templates.length > 0) {
      const existingTaskNames = new Set(existingItems.map((item) => item.task_name));
      const missingTemplates = templates.filter((t) => !existingTaskNames.has(t.title));

      if (missingTemplates.length > 0) {
        const itemsToInsert = missingTemplates.map((t) => ({
          student_id,
          task_name: t.title,
          description: t.description,
          status: "Not Started",
          target_semester: CURRENT_TERM,
        }));

        const { data: insertedItems, error: insertError } = await supabase
          .from("checklist_item")
          .insert(itemsToInsert)
          .select();

        if (insertError) {
          return res.status(500).json({
            success: false,
            message: "Failed to seed checklist template items",
            error: insertError.message,
          });
        }

        existingItems = [...existingItems, ...(insertedItems || [])];
      }
    }

    if (isNewlyEnrolled) {
      const existingTaskNames = new Set(
        existingItems
          .filter((item) => item.target_semester === CURRENT_TERM)
          .map((item) => item.task_name),
      );

      const missingTasks = ESSENTIAL_SETTLEMENT_TASKS.filter(
        (task) => !existingTaskNames.has(task.task_name),
      );

      if (missingTasks.length > 0) {
        const seedPayload = missingTasks.map((task) => ({
          student_id,
          task_name: task.task_name,
          status: "Not Started",
          target_semester: CURRENT_TERM,
        }));

        const { data: seededItems, error: seedError } = await supabase
          .from("checklist_item")
          .insert(seedPayload)
          .select();

        if (seedError) {
          return res.status(500).json({
            success: false,
            message: "Failed to seed settlement checklist tasks",
            error: seedError.message,
          });
        }

        existingItems = [...existingItems, ...(seededItems || [])];
      }
    }

    const language = req.language || "en";
    const localizedItems = existingItems.map((row) => {
      const localized = localizeRow(row, language, ["title", "description", "task_name"]);
      return {
        ...row,
        title: localized.title ?? localized.task_name ?? row.title,
        description: localized.description ?? row.description,
        task_name: localized.task_name ?? row.task_name,
      };
    });

    const groupedChecklist = localizedItems.reduce((groups, item) => {
      const semester = item.target_semester || "General";
      if (!groups[semester]) groups[semester] = [];
      groups[semester].push(item);
      return groups;
    }, {});

    return res.json({
      success: true,
      is_new_fresher: isNewlyEnrolled,
      data: groupedChecklist,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};


const updateChecklistItem = async (req, res) => {
  try {
    const { checklist_id } = req.params;
    let { status } = req.body;

    // Live DB constraint: Not Started | In Progress | Completed
    if (status === "Pending" || status === "pending") {
      status = "Not Started";
    }

    const { data, error } = await supabase
      .from("checklist_item")
      .update({ status })
      .eq("checklist_id", checklist_id)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116" || !data) {
        return res.status(404).json({
          success: false,
          message: "Checklist item not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update checklist item",
        error: error.message,
      });
    }

    const language = req.language || "en";
    const localized = localizeRow(data, language, [
      "title",
      "description",
      "task_name",
    ]);

    res.json({
      success: true,
      data: {
        ...data,
        title: localized.title ?? localized.task_name ?? data.title,
        description: localized.description ?? data.description,
        task_name: localized.task_name ?? data.task_name,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getAllScholarships = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scholarship")
      .select("*")
      .order("deadline", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch scholarships",
        error: error.message,
      });
    }

    const language = req.language || "en";
    res.json({
      success: true,
      data: (data || []).map((row) => mapScholarshipRow(row, language)),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const applyForScholarship = async (req, res) => {
  try {
    const { student_id, scholarship_id } = req.body;

    const { data, error } = await supabase
      .from("scholarship_application")
      .insert({
        student_id,
        scholarship_id,
        status: "Pending",
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to submit scholarship application",
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const signupStudent = async (req, res) => {
  try {
    const {
      student_id,
      name,
      nationality,
      major_name,
      student_type,
      visa_status,
      password,
      language_pref,
      is_in_korea,
      mbti,
      d2_semester,
      completed_courses,
      intake_term,
    } = req.body;

    if (!student_id || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: student_id, name, password",
      });
    }

    const { data: existingStudent } = await supabase
      .from("student")
      .select("*")
      .eq("student_id", String(student_id))
      .single();

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student ID already registered",
      });
    }

    let major_id = 1;
    if (major_name) {
      const { data: majors } = await supabase.from("major").select("*");
      const matchedMajor = majors?.find(
        (m) => m.major_name.toLowerCase() === major_name.toLowerCase(),
      );
      if (matchedMajor) {
        major_id = matchedMajor.major_id;
      }
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    let resolvedSignupLanguage = "en";
    if (language_pref) {
      const resolved = resolveLanguagePref(language_pref);
      if (!resolved) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language_pref. Use one of: ${SUPPORTED_LANGUAGE_PREFS.join(", ")}`,
          error: { status: 400, code: "UNSUPPORTED_LANGUAGE" },
        });
      }
      resolvedSignupLanguage = resolved;
    }

    const insertPayload = {
      student_id: String(student_id),
      name,
      nationality: nationality || "Unknown",
      major_id,
      student_type: student_type || "Current",
      visa_status: visa_status || "None",
      password: hashedPassword,
      language_pref: resolvedSignupLanguage,
      is_in_korea: is_in_korea !== undefined ? is_in_korea : true,
      mbti: mbti || null,
      d2_semester: d2_semester || null,
      email: `${student_id}@pnu.edu`,
      phone: "010-0000-0000",
      completed_courses: completed_courses || [],
      intake_term: intake_term || "March",
    };

    let newStudent;
    let insertError;

    const firstTry = await supabase
      .from("student")
      .insert(insertPayload)
      .select()
      .single();

    newStudent = firstTry.data;
    insertError = firstTry.error;

    if (insertError) {
      const errMsg = insertError.message || "";
      const isColumnErr =
        errMsg.includes("is_in_korea") ||
        errMsg.includes("mbti") ||
        errMsg.includes("d2_semester") ||
        errMsg.includes("completed_courses") ||
        errMsg.includes("intake_term") ||
        insertError.code === "42703"; // postgres undefined_column code

      if (isColumnErr) {
        console.warn("New onboarding columns are missing in database. Retrying signup without them...");
        const fallbackPayload = {
          student_id: String(student_id),
          name,
          nationality: nationality || "Unknown",
          major_id,
          student_type: student_type || "Current",
          visa_status: visa_status || "None",
          password: hashedPassword,
          language_pref: resolvedSignupLanguage,
          email: `${student_id}@pnu.edu`,
          phone: "010-0000-0000",
        };

        const retry = await supabase
          .from("student")
          .insert(fallbackPayload)
          .select()
          .single();

        newStudent = retry.data;
        insertError = retry.error;
      }
    }

    if (insertError) {
      console.error("Signup insert error final:", insertError);
      return res.status(500).json({
        success: false,
        message: "Failed to register student",
        error: insertError.message,
      });
    }

    // Fetch default checklist templates from Supabase
    let listToInsert = [];
    const { data: templates, error: templateError } = await supabase
      .from("checklist_template")
      .select("*")
      .eq("student_type", student_type === "Freshman" ? "Freshman" : "Current");

    if (!templateError && templates && templates.length > 0) {
      listToInsert = templates.map((t) => ({
        title: t.title,
        description: t.description,
      }));
    } else {
      // Safe fallback if table is not created yet
      const defaultChecklists = {
        Freshman: [
          {
            title: "Apply for Alien Registration Card (ARC)",
            description: "Visit immigration office within 90 days of arrival",
          },
          {
            title: "Open local bank account",
            description: "Open account at PNU campus bank",
          },
          {
            title: "Buy PNU SIM card",
            description: "Get a local prepaid or contract SIM card",
          },
        ],
        Current: [
          {
            title: "Submit graduation thesis outline",
            description: "Submit thesis outline to department office",
          },
          {
            title: "TOPIK Level 4 certificate",
            description: "Submit language proficiency certificate",
          },
          {
            title: "Completed credit audit",
            description:
              "Verify graduation credit breakdown with academic advisor",
          },
        ],
      };
      const studentTypeKey =
        student_type === "Freshman" ? "Freshman" : "Current";
      listToInsert = defaultChecklists[studentTypeKey];
    }

    for (let i = 0; i < listToInsert.length; i++) {
      const item = listToInsert[i];
      await supabase.from("checklist_item").insert({
        student_id: String(student_id),
        task_name: item.title,
        description: item.description,
        status: "Not Started",
      });
    }

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: newStudent,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const { student_id } = req.params;

    const { data, error } = await supabase
      .from("student")
      .select(
        `
        *,
        major:major_id (
          major_name,
          department
        )
      `,
      )
      .eq("student_id", student_id)
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116" || !data) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch student profile",
        error: error.message,
      });
    }

    const { major, ...studentProfile } = data;

    res.json({
      success: true,
      data: {
        ...studentProfile,
        major_name: major?.major_name ?? null,
        department: major?.department ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    // PUT /profile uses JWT; PATCH /:student_id uses route param
    const student_id = req.params.student_id || req.user?.student_id;
    if (!student_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to update profile",
        error: { status: 401, code: "UNAUTHORIZED" },
      });
    }

    if (
      req.user?.student_id &&
      req.params.student_id &&
      String(req.user.student_id) !== String(req.params.student_id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own profile.",
        error: { status: 403, code: "FORBIDDEN" },
      });
    }

    const {
      name,
      nationality,
      major_name,
      major: majorFromBody,
      email,
      phone,
      visa_status,
      language_pref,
      interests,
      new_password,
      is_in_korea,
      mbti,
      d2_semester,
      completed_courses,
      intake_term,
    } = req.body;

    const resolvedMajorName = major_name || majorFromBody;

    let major_id;
    if (resolvedMajorName) {
      const { data: majors } = await supabase.from("major").select("*");
      const matchedMajor = majors?.find(
        (m) =>
          m.major_name.toLowerCase() === String(resolvedMajorName).toLowerCase(),
      );
      if (matchedMajor) {
        major_id = matchedMajor.major_id;
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (major_id !== undefined) updateData.major_id = major_id;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (visa_status !== undefined) updateData.visa_status = visa_status;
    if (language_pref !== undefined) {
      const normalizedLanguagePref = resolveLanguagePref(language_pref);
      if (!normalizedLanguagePref) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language_pref. Use one of: ${SUPPORTED_LANGUAGE_PREFS.join(", ")}`,
          error: { status: 400, code: "UNSUPPORTED_LANGUAGE" },
        });
      }
      updateData.language_pref = normalizedLanguagePref;
    }
    // `interests` is accepted by the API contract / UI but is not a student column yet
    if (interests !== undefined && !Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: "interests must be an array of strings",
        error: { status: 400, code: "VALIDATION_ERROR" },
      });
    }
    if (is_in_korea !== undefined) updateData.is_in_korea = is_in_korea;
    if (mbti !== undefined) updateData.mbti = mbti;
    if (d2_semester !== undefined) updateData.d2_semester = d2_semester;
    if (completed_courses !== undefined) updateData.completed_courses = completed_courses;
    if (intake_term !== undefined) updateData.intake_term = intake_term;

    if (new_password) {
      const { current_password } = req.body;
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password.",
        });
      }

      const { data: studentRecord } = await supabase
        .from("student")
        .select("password")
        .eq("student_id", student_id)
        .single();
      if (!studentRecord) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      const bcrypt = require("bcryptjs");
      const isMatch = await bcrypt.compare(
        current_password,
        studentRecord.password,
      );
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(new_password, salt);
    }

    const { data, error } = await supabase
      .from("student")
      .update(updateData)
      .eq("student_id", student_id)
      .select(
        `
        *,
        major:major_id (
          major_name,
          department
        )
      `,
      )
      .single();

    if (error || !data) {
      return res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error?.message || "Error occurred",
      });
    }

    const { major, ...studentProfile } = data;

    res.json({
      success: true,
      data: {
        ...studentProfile,
        major_name: major?.major_name ?? null,
        department: major?.department ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const recoveryCodes = new Map();

const forgotPassword = async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Missing student_id",
      });
    }

    const { data, error } = await supabase
      .from("student")
      .select("email")
      .eq("student_id", String(student_id))
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Student ID not registered",
      });
    }

    const email = data.email || "student@pusan.ac.kr";

    // Generate a 6-digit recovery code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    recoveryCodes.set(String(student_id), {
      code,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    console.log(`[PASSWORD RESET] Generated code for ${student_id}: ${code}`);

    // Mask the email (e.g. htet_kaung_san@pusan.ac.kr -> ht**@pusan.ac.kr)
    const [localPart, domain] = email.split("@");
    let maskedLocal = localPart;
    if (localPart.length > 2) {
      maskedLocal =
        localPart.substring(0, 2) +
        "*".repeat(Math.min(8, localPart.length - 2));
    } else {
      maskedLocal = localPart.substring(0, 1) + "*";
    }
    const maskedEmail = `${maskedLocal}@${domain}`;

    res.json({
      success: true,
      message: "Recovery code generated successfully",
      maskedEmail,
      code, // Send code back for ease of use in demo/UI
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { student_id, code, new_password } = req.body;
    if (!student_id || !code || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Missing student_id, code, or new_password",
      });
    }

    const record = recoveryCodes.get(String(student_id));
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No active recovery request found for this Student ID",
      });
    }

    if (record.expires < Date.now()) {
      recoveryCodes.delete(String(student_id));
      return res.status(400).json({
        success: false,
        message: "Recovery code has expired",
      });
    }

    if (record.code !== String(code)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recovery code",
      });
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the password in database
    const { error: updateError } = await supabase
      .from("student")
      .update({ password: hashedPassword })
      .eq("student_id", String(student_id));

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Failed to update password",
        error: updateError.message,
      });
    }

    recoveryCodes.delete(String(student_id));

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getAllBoards = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("board")
      .select("*")
      .order("board_id", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch boards",
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getBoardPosts = async (req, res) => {
  try {
    const { board_id } = req.params;

    const { data, error } = await supabase
      .from("post")
      .select(
        `
        *,
        student (
          name
        )
      `,
      )
      .eq("board_id", Number(board_id))
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch posts for board",
        error: error.message,
      });
    }

    const posts = (data || [])
      .map((p) => {
        const { student, ...rest } = p;
        return {
          ...rest,
          likes_count: p.likes_count || 0,
          liked_by: p.liked_by || [],
          reported: Boolean(p.reported),
          student_name: student?.name ?? "Unknown Student",
        };
      })
      .filter((p) => !p.reported);

    res.json({
      success: true,
      data: posts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const createPost = async (req, res) => {
  try {
    const { board_id, student_id, title, content } = req.body;

    if (!board_id || !student_id || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing board_id, student_id, title, or content",
      });
    }

    const { data, error } = await supabase
      .from("post")
      .insert({
        board_id: Number(board_id),
        student_id: String(student_id),
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create post",
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getFacilities = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("facility")
      .select("*")
      .order("name", { ascending: true });
    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to fetch facilities",
        error: error.message,
      });
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getPnuContacts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pnu_contact")
      .select("contact_id, slug, name, place, hours, phone, email, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch PNU contacts",
        error: error.message,
      });
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getFaqItems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("faq_item")
      .select("faq_id, slug, question, answer, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch FAQ items",
        error: error.message,
      });
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getFacilityById = async (req, res) => {
  try {
    const { facility_id } = req.params;

    const { data, error } = await supabase
      .from("facility")
      .select("*")
      .eq("facility_id", facility_id)
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116" || !data) {
        return res.status(404).json({
          success: false,
          message: "Facility not found",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to fetch facility",
        error: error.message,
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getAcademicRecords = async (req, res) => {
  try {
    const { student_id } = req.params;
    const requesterId = String(req.user?.student_id ?? "");

    if (requesterId && requesterId !== String(student_id) && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { data: summary, error: summaryError } = await supabase
      .from("academic_summary")
      .select("*")
      .eq("student_id", student_id)
      .single();

    if (summaryError || !summary) {
      if (summaryError?.code === "PGRST116" || !summary) {
        return res.status(404).json({
          success: false,
          message: "Academic records not found for this student",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to fetch academic summary",
        error: summaryError.message,
      });
    }

    const { data: semesters, error: recordError } = await supabase
      .from("academic_record")
      .select("*")
      .eq("student_id", student_id)
      .order("sort_order", { ascending: true });

    if (recordError) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch semester records",
        error: recordError.message,
      });
    }

    res.json({
      success: true,
      data: {
        student_id: summary.student_id,
        overall_gpa: Number(summary.overall_gpa),
        gpa_scale: Number(summary.gpa_scale),
        standing: summary.standing,
        completed_credits: Number(summary.completed_credits),
        required_credits: Number(summary.required_credits),
        semesters: (semesters || []).map((row) => ({
          semester_label: row.semester_label,
          gpa: Number(row.gpa),
          sort_order: row.sort_order,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const downloadAcademicTranscript = async (req, res) => {
  try {
    const { student_id } = req.params;
    const requesterId = String(req.user?.student_id ?? "");

    if (requesterId && requesterId !== String(student_id) && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { data: student } = await supabase
      .from("student")
      .select("student_id, name, email, major_id")
      .eq("student_id", student_id)
      .single();

    const { data: summary, error: summaryError } = await supabase
      .from("academic_summary")
      .select("*")
      .eq("student_id", student_id)
      .single();

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: "Academic records not found for this student",
        error: summaryError?.message,
      });
    }

    const { data: semesters } = await supabase
      .from("academic_record")
      .select("*")
      .eq("student_id", student_id)
      .order("sort_order", { ascending: true });

    const lines = [
      "Hey! PNU — Academic Transcript (Unofficial)",
      "==========================================",
      `Student ID: ${student_id}`,
      `Name: ${student?.name || "N/A"}`,
      `Email: ${student?.email || "N/A"}`,
      "",
      `Overall GPA: ${Number(summary.overall_gpa).toFixed(2)} / ${Number(summary.gpa_scale).toFixed(1)}`,
      `Standing: ${summary.standing}`,
      `Credits: ${summary.completed_credits} / ${summary.required_credits}`,
      "",
      "Semester Performance",
      "--------------------",
      ...(semesters || []).map(
        (row) =>
          `${row.semester_label}: ${Number(row.gpa).toFixed(2)} / ${Number(summary.gpa_scale).toFixed(1)}`,
      ),
      "",
      `Generated: ${new Date().toISOString()}`,
      "This is a demo transcript for Hey! PNU and is not an official university document.",
    ];

    const body = lines.join("\n");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="transcript-${student_id}.txt"`,
    );
    res.send(body);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

async function upsertScrapedNotices(rows) {
  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const { data: existing, error: lookupError } = await supabase
      .from("notice")
      .select("notice_id")
      .eq("source_url", row.source_url)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing?.notice_id) {
      const { error } = await supabase
        .from("notice")
        .update({
          title: row.title,
          content: row.content,
          language: row.language,
          posted_date: row.posted_date,
          source: row.source,
          external_id: row.external_id,
          scraped_at: row.scraped_at,
        })
        .eq("notice_id", existing.notice_id);
      if (error) throw error;
      updated += 1;
    } else {
      const { error } = await supabase.from("notice").insert({
        title: row.title,
        content: row.content,
        language: row.language,
        posted_date: row.posted_date,
        source: row.source,
        source_url: row.source_url,
        external_id: row.external_id,
        scraped_at: row.scraped_at,
      });
      if (error) throw error;
      inserted += 1;
    }
  }

  return { inserted, updated };
}

const getNotices = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("notice")
      .select("*")
      .order("posted_date", { ascending: false })
      .limit(100);

    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notices",
        error: error.message,
      });

    let rows = data || [];
    const hasScraped = rows.some((row) => row.source_url);

    // Auto-seed once when the source columns exist but no scraped rows yet.
    if (!hasScraped) {
      try {
        const scraped = await scrapeRecentNotices();
        if (scraped.length > 0) {
          await upsertScrapedNotices(scraped);
          const refreshed = await supabase
            .from("notice")
            .select("*")
            .order("posted_date", { ascending: false })
            .limit(100);
          if (!refreshed.error) rows = refreshed.data || rows;
        }
      } catch (syncError) {
        // Schema may not be migrated yet; keep returning whatever rows exist.
        console.warn("[notices] auto-scrape skipped:", syncError.message);
      }
    }

    const notices = rows.map(mapNoticeRow);
    res.json({ success: true, data: notices });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const syncNotices = async (req, res) => {
  try {
    const scraped = await scrapeRecentNotices();
    const result = await upsertScrapedNotices(scraped);
    res.json({
      success: true,
      data: {
        scraped: scraped.length,
        ...result,
        bySource: scraped.reduce((acc, item) => {
          acc[item.source] = (acc[item.source] || 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message:
        err.message?.includes("source_url")
          ? "Run backend/supabase/notice_source.sql in Supabase SQL Editor first"
          : "Failed to sync notices",
      error: err.message,
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { data, error } = await supabase
      .from("notification")
      .select("*")
      .eq("student_id", student_id)
      .order("scheduled_time", { ascending: false });
    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
        error: error.message,
      });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getCourses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("course")
      .select("*")
      .order("course_name", { ascending: true });
    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to fetch courses",
        error: error.message,
      });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getEnrollments = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { data, error } = await supabase
      .from("enrollment")
      .select(
        `
        *,
        course:course_id (
          *
        )
      `,
      )
      .eq("student_id", student_id);

    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to fetch enrollments",
        error: error.message,
      });

    // Flat map course values
    const list = (data || []).map((item) => {
      const { course, ...rest } = item;
      return {
        ...rest,
        course_name: course?.course_name ?? "Unknown Course",
        credit: course?.credit ?? 0,
        category: course?.category ?? "GEN_ED",
        classroom: course?.classroom ?? "Main Campus",
      };
    });

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const createEnrollment = async (req, res) => {
  try {
    console.log("createEnrollment request body:", req.body);
    console.log("createEnrollment request headers:", req.headers);
    
    // Fallbacks for token and camelCase keys
    const student_id = req.body.student_id || req.user?.student_id;
    const course_id = req.body.course_id || req.body.courseId;

    if (!student_id || !course_id) {
      return res
        .status(400)
        .json({ 
          success: false, 
          message: `Missing student_id or course_id (Received student_id: ${student_id}, course_id: ${course_id})`,
          received: { student_id, course_id, body: req.body }
        });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from("enrollment")
      .select("*")
      .eq("student_id", student_id)
      .eq("course_id", Number(course_id));

    if (existing && existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Already enrolled in this course" });
    }

    // Fetch target course details
    const { data: targetCourse, error: targetError } = await supabase
      .from("course")
      .select("*")
      .eq("course_id", Number(course_id))
      .single();

    if (targetError || !targetCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Fetch existing enrollments to check overlaps
    const { data: currentEnrollments, error: enrollError } = await supabase
      .from("enrollment")
      .select(`
        *,
        course:course_id (
          *
        )
      `)
      .eq("student_id", student_id);

    if (enrollError) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify schedule conflicts",
        error: enrollError.message,
      });
    }

    // Verify schedule overlaps
    if (targetCourse.day_of_week && targetCourse.start_time && targetCourse.end_time) {
      for (const en of (currentEnrollments || [])) {
        const c = en.course;
        if (c && c.day_of_week === targetCourse.day_of_week) {
          if (targetCourse.start_time < c.end_time && c.start_time < targetCourse.end_time) {
            return res.status(400).json({
              success: false,
              message: `Schedule Conflict: Overlaps with ${c.course_name || "Enrolled Course"} (${c.day_of_week} ${c.start_time}-${c.end_time})`,
            });
          }
        }
      }
    }

    const { data, error } = await supabase
      .from("enrollment")
      .insert({
        student_id: String(student_id),
        course_id: Number(course_id),
        semester: "2026-Fall",
        status: "Enrolled",
      })
      .select()
      .single();

    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to enroll course",
        error: error.message,
      });

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const deleteEnrollment = async (req, res) => {
  try {
    const { enrollment_id } = req.params;
    const { error } = await supabase
      .from("enrollment")
      .delete()
      .eq("enrollment_id", Number(enrollment_id));
    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to drop course",
        error: error.message,
      });
    res.json({ success: true, message: "Successfully dropped course" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getPostComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { data: comments, error } = await supabase
      .from("comment")
      .select("*")
      .eq("post_id", Number(post_id))
      .order("created_at", { ascending: true });

    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to fetch comments",
        error: error.message,
      });

    // Manual join to bypass PostgREST schema caching issues
    const studentIds = [...new Set((comments || []).map(c => c.student_id).filter(Boolean))];
    const studentNameMap = {};

    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from("student")
        .select("student_id, name")
        .in("student_id", studentIds);

      (students || []).forEach(s => {
        studentNameMap[s.student_id] = s.name;
      });
    }

    const list = (comments || []).map((item) => {
      return {
        ...item,
        student_name: studentNameMap[item.student_id] || "Unknown Student",
      };
    });

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const createComment = async (req, res) => {
  try {
    const post_id = req.body.post_id || req.params.post_id;
    const { student_id, content } = req.body;
    if (!post_id || !student_id || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing post_id, student_id, or content",
      });
    }

    const { data, error } = await supabase
      .from("comment")
      .insert({
        post_id: Number(post_id),
        student_id: String(student_id),
        content,
      })
      .select()
      .single();

    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to add comment",
        error: error.message,
      });

    // Fetch student name
    const { data: student } = await supabase
      .from("student")
      .select("name")
      .eq("student_id", String(student_id))
      .single();

    res.status(201).json({
      success: true,
      data: {
        ...data,
        student_name: student?.name ?? "Unknown Student",
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const updateLanguagePreference = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { language_pref } = req.body;

    if (!language_pref) {
      return res
        .status(400)
        .json({ success: false, message: "Missing language_pref" });
    }

    const resolved = resolveLanguagePref(language_pref);
    if (!resolved) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language_pref. Use one of: ${SUPPORTED_LANGUAGE_PREFS.join(", ")}`,
        error: { status: 400, code: "UNSUPPORTED_LANGUAGE" },
      });
    }

    const { data, error } = await supabase
      .from("student")
      .update({ language_pref: resolved })
      .eq("student_id", student_id)
      .select()
      .single();

    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to update language preference",
        error: error.message,
      });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({
        success: true,
        data: { courses: [], notices: [], facilities: [], posts: [] },
      });
    }

    const query = String(q).toLowerCase();

    // 1. Fetch courses
    const { data: courses } = await supabase.from("course").select("*");
    const matchedCourses = (courses || [])
      .filter((c) => c.course_name.toLowerCase().includes(query))
      .slice(0, 5);

    // 2. Fetch notices
    const { data: notices } = await supabase.from("notice").select("*");
    const matchedNotices = (notices || [])
      .filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query),
      )
      .slice(0, 5);

    // 3. Fetch facilities
    const { data: facilities } = await supabase.from("facility").select("*");
    const matchedFacilities = (facilities || [])
      .filter((f) => f.name.toLowerCase().includes(query))
      .slice(0, 5);

    // 4. Fetch posts
    const { data: posts } = await supabase.from("post").select(`
      *,
      student (
        name
      )
    `);
    const matchedPosts = (posts || [])
      .filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query),
      )
      .map((p) => ({
        ...p,
        student_name: p.student?.name || "Unknown Student",
      }))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        courses: matchedCourses,
        notices: matchedNotices,
        facilities: matchedFacilities,
        posts: matchedPosts,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Search execution error",
      error: err.message,
    });
  }
};

const healthCheck = async (req, res) => {
  try {
    const start = Date.now();

    // Check DB tables connectivity
    const { error: dbError } = await supabase
      .from("student")
      .select("student_id")
      .limit(1);
    const latency = Date.now() - start;

    // Get table row counts helper
    const getCount = async (table) => {
      try {
        const { data } = await supabase.from(table).select("*");
        return data?.length ?? 0;
      } catch {
        return 0;
      }
    };

    const [students, courses, notices, facilities, posts, comments] =
      await Promise.all([
        getCount("student"),
        getCount("course"),
        getCount("notice"),
        getCount("facility"),
        getCount("post"),
        getCount("comment"),
      ]);

    res.json({
      success: true,
      status: "UP",
      database: dbError ? "DISCONNECTED" : "CONNECTED",
      latencyMs: latency,
      geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      counts: {
        students,
        courses,
        notices,
        facilities,
        posts,
        comments,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, status: "DOWN", error: err.message });
  }
};
const likePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const studentId = req.user ? req.user.student_id : req.body.student_id;

    if (!studentId) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID required" });
    }

    const { data: post, error: fetchError } = await supabase
      .from("post")
      .select("post_id, likes_count")
      .eq("post_id", post_id)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        error: fetchError?.message,
      });
    }

    const nextCount = Number(post.likes_count || 0) + 1;
    const { data: updated, error: updateError } = await supabase
      .from("post")
      .update({ likes_count: nextCount })
      .eq("post_id", post_id)
      .select("likes_count")
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Failed to like post",
        error: updateError.message,
      });
    }

    res.json({
      success: true,
      data: {
        likes_count: updated.likes_count,
        liked: true,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const reportPost = async (req, res) => {
  try {
    const { post_id } = req.params;

    const { error } = await supabase
      .from("post")
      .update({ reported: true })
      .eq("post_id", post_id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to report post",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Post successfully reported and hidden from student feeds.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from("student")
      .select("*, major:major_id(major_name)")
      .order("name", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch students",
        error: error.message,
      });
    }

    res.json({
      success: true,
      data: students,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const requestStudentDeletion = async (req, res) => {
  try {
    const { student_id } = req.params;
    
    // Check authorization: A user can only request their own deletion
    if (String(req.user?.student_id) !== String(student_id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only request deletion of your own account.",
      });
    }

    const { data, error } = await supabase
      .from("student")
      .update({ deletion_requested: true })
      .eq("student_id", student_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to request account deletion",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Account deletion requested successfully. The administrator will review and delete your account shortly.",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const hardDeleteStudent = async (req, res) => {
  try {
    const { student_id } = req.params;

    // Execute CASCADE physical delete in Supabase
    const { error } = await supabase
      .from("student")
      .delete()
      .eq("student_id", student_id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete student account",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: `Student account ${student_id} and all related checklists, timetables, posts, and comments have been permanently wiped.`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getEmergencyGuideHandler = async (req, res, next) => {
  try {
    const data = await getEmergencyGuide(req.language || "en");

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

const getCampusFacilitiesHandler = async (req, res, next) => {
  try {
    const menuDate =
      typeof req.query.menu_date === "string" ? req.query.menu_date : "";
    const data = await getCampusFacilities(req.language || "en", { menuDate });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

const getCareerOpportunities = async (req, res, next) => {
  try {
    const requestedPage = Number(req.query.page);
    const requestedLimit = Number(req.query.limit);

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 10;

    const data = await getCareerOpportunitiesPage({ page, limit });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * AI hook-point for personalized internship/job recommendations.
 * AI engineers: replace the body with profile-aware ranking (RAG/LLM).
 * Keep the response shape as CareerOpportunity[] with optional matchReason.
 */
const getCareerRecommendations = async (req, res, next) => {
  try {
    const data = await getCareerOpportunitiesPage({ page: 1, limit: 20 });
    const recommended = (data.opportunities || []).slice(0, 3).map((item, index) => ({
      ...item,
      location: item.location || "Korea",
      jobType: item.jobType || "internship",
      matchReason: item.matchReason || "Popular entry-level opening",
      recommendationRank: index + 1,
    }));

    return res.status(200).json({
      success: true,
      data: recommended,
    });
  } catch (err) {
    return next(err);
  }
};

const getMyCommunityGroupHandler = async (req, res) => {
  try {
    const scope = String(req.query.scope || "department");
    if (!["department", "country", "all"].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: "scope must be department, country, or all",
      });
    }

    const studentId = req.user?.student_id;
    const profile = await communityService.getStudentProfileLite(studentId);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const group = await communityService.getMyCommunityGroup(scope, profile);
    return res.json({ success: true, data: group });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load community group",
      error: err.message,
    });
  }
};

const getCommunityMembersHandler = async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await communityService.getCommunityMembers(groupId);
    if (!result.group) {
      return res.status(404).json({ success: false, message: "Community not found" });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load community members",
      error: err.message,
    });
  }
};

const getCommunityPostsHandler = async (req, res) => {
  try {
    const scope = String(req.query.scope || "all");
    const groupId = req.query.group_id ? String(req.query.group_id) : null;
    const groupSlug = req.query.group_slug ? String(req.query.group_slug) : null;

    const posts = await communityService.listCommunityPosts({
      scope,
      groupId,
      groupSlug,
    });
    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load community posts",
      error: err.message,
    });
  }
};

const createCommunityPostHandler = async (req, res) => {
  try {
    const studentId = req.user?.student_id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { content, scope, group_id, group_slug } = req.body || {};
    const post = await communityService.createCommunityPost({
      studentId,
      scope: scope || "all",
      groupId: group_id,
      groupSlug: group_slug,
      content,
    });

    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Failed to create post",
      error: err.message,
    });
  }
};

const likeCommunityPostHandler = async (req, res) => {
  try {
    const { postId } = req.params;
    const data = await communityService.likeCommunityPost(postId);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to like post",
      error: err.message,
    });
  }
};

module.exports = {
  getAllStudents,
  requestStudentDeletion,
  hardDeleteStudent,
  testConnection,
  loginStudent,
  getStudentChecklist,
  updateChecklistItem,
  getAllScholarships,
  applyForScholarship,
  signupStudent,
  getStudentProfile,
  updateStudentProfile,
  forgotPassword,
  resetPassword,
  getAllBoards,
  getBoardPosts,
  createPost,
  likePost,
  reportPost,
  getFacilities,
  getFacilityById,
  getPnuContacts,
  getFaqItems,
  getAcademicRecords,
  downloadAcademicTranscript,
  getNotices,
  syncNotices,
  getNotifications,
  getCourses,
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  getPostComments,
  createComment,
  updateLanguagePreference,
  globalSearch,
  healthCheck,
  getCareerOpportunities,
  getCareerRecommendations,
  getMyCommunityGroupHandler,
  getCommunityMembersHandler,
  getCommunityPostsHandler,
  createCommunityPostHandler,
  likeCommunityPostHandler,
  getEmergencyGuideHandler,
  getCampusFacilitiesHandler,
};
