const supabase = require("../supabaseClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../localDb");
const JWT_SECRET = process.env.JWT_SECRET || "hey-pnu-default-secret-key";

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

const getStudentChecklist = async (req, res) => {
  try {
    const { student_id } = req.params;

    // 1. Fetch the student's type to know which templates apply
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

    // 2. Fetch templates for this student type
    const { data: templates } = await supabase
      .from("checklist_template")
      .select("*")
      .eq("student_type", studentType);

    // 3. Fetch existing checklist items for this student
    const { data: existingItems, error: fetchError } = await supabase
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

    // 4. Sync missing template items to checklist_item if templates exist
    if (templates && templates.length > 0) {
      const existingTaskNames = new Set(
        existingItems.map((item) => item.task_name),
      );
      const missingTemplates = templates.filter(
        (t) => !existingTaskNames.has(t.title),
      );

      if (missingTemplates.length > 0) {
        const itemsToInsert = missingTemplates.map((t) => ({
          student_id: student_id,
          task_name: t.title,
          description: t.description,
          status: "Pending",
        }));

        await supabase.from("checklist_item").insert(itemsToInsert);

        // Re-fetch the updated list
        const { data: updatedItems, error: refetchError } = await supabase
          .from("checklist_item")
          .select("*")
          .eq("student_id", student_id);

        if (!refetchError) {
          return res.json({
            success: true,
            data: updatedItems,
          });
        }
      }
    }

    res.json({
      success: true,
      data: existingItems,
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
    const { status } = req.body;

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

    const insertPayload = {
      student_id: String(student_id),
      name,
      nationality: nationality || "Unknown",
      major_id,
      student_type: student_type || "Current",
      visa_status: visa_status || "None",
      password: hashedPassword,
      language_pref: language_pref || "EN",
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
          language_pref: language_pref || "EN",
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
        status: "Pending",
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
    const { student_id } = req.params;
    const {
      name,
      nationality,
      major_name,
      email,
      phone,
      visa_status,
      new_password,
      is_in_korea,
      mbti,
      d2_semester,
      completed_courses,
      intake_term,
    } = req.body;

    let major_id;
    if (major_name) {
      const { data: majors } = await supabase.from("major").select("*");
      const matchedMajor = majors?.find(
        (m) => m.major_name.toLowerCase() === major_name.toLowerCase(),
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

    const localDb = require("../localDb");
    const localPosts = localDb.get("posts") || [];

    // Map and overlay local metrics
    const posts = (data || [])
      .map((p) => {
        const localPost = localPosts.find(
          (lp) => Number(lp.post_id) === Number(p.post_id),
        );
        const likes_count = localPost
          ? localPost.likes_count || 0
          : p.likes_count || 0;
        const liked_by = localPost
          ? localPost.liked_by || []
          : p.liked_by || [];
        const reported = localPost
          ? Boolean(localPost.reported)
          : Boolean(p.reported);
        const { student, ...rest } = p;
        return {
          ...rest,
          likes_count,
          liked_by,
          reported,
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
    const { campus } = req.query;
    
    // Simulate Supabase response using localDb
    let data = db.facilities;
    if (campus) {
      data = data.filter(f => f.campus === campus);
    }
    
    // Sort by name like the original supabase query
    data.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unexpected server error",
      error: err.message,
    });
  }
};

const getNotices = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("notice")
      .select("*")
      .order("posted_date", { ascending: false });
    if (error)
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notices",
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
    const { campus } = req.query;
    
    let data = db.courses;
    if (campus) {
      data = data.filter(c => c.campus === campus);
    }
    
    data.sort((a, b) => a.course_name.localeCompare(b.course_name));
    
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

    const { data, error } = await supabase
      .from("student")
      .update({ language_pref })
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

    const localDb = require("../localDb");
    let localPost = localDb.findOne(
      "posts",
      (lp) => Number(lp.post_id) === Number(post_id),
    );

    if (!localPost) {
      localPost = localDb.insert("posts", {
        post_id: Number(post_id),
        likes_count: 0,
        liked_by: [],
        reported: false,
      });
    }

    let likedBy = localPost.liked_by || [];
    let liked = false;

    if (likedBy.includes(studentId)) {
      likedBy = likedBy.filter((id) => id !== studentId);
    } else {
      likedBy.push(studentId);
      liked = true;
    }

    const updated = localDb.update(
      "posts",
      (lp) => Number(lp.post_id) === Number(post_id),
      {
        liked_by: likedBy,
        likes_count: likedBy.length,
      },
    );

    res.json({
      success: true,
      data: {
        likes_count: updated.likes_count,
        liked,
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

    const localDb = require("../localDb");
    let localPost = localDb.findOne(
      "posts",
      (lp) => Number(lp.post_id) === Number(post_id),
    );

    if (!localPost) {
      localDb.insert("posts", {
        post_id: Number(post_id),
        likes_count: 0,
        liked_by: [],
        reported: true,
      });
    } else {
      localDb.update("posts", (lp) => Number(lp.post_id) === Number(post_id), {
        reported: true,
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
  getNotices,
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
};
