const departmentProfiles = require("../ai/departmentProfiles");
const { recommendMajors } = require("../ai/recommendationEngine");
const supabase = require("../supabaseClient");
const ragService = require("../services/ragService");
const {
  createClaudeMajorAnalysis,
} = require("../services/claudeMajorRecommendationService");
const {
  isGeminiConfigured,
  generateGeminiChat,
  generateGeminiChatStream,
  generateGeminiMajorAnalysis,
  translateGeminiAnnouncement,
} = require("../services/geminiService");
const {
  isOpenRouterConfigured,
  generateOpenRouterChat,
  generateOpenRouterChatStream,
  generateOpenRouterMajorAnalysis,
} = require("../services/openrouterService");
async function getAcademicPromptContext(studentId, supabaseClient) {
  if (!studentId) return "";
  try {
    const { data: student } = await supabaseClient
      .from("student")
      .select("student_id, student_type, completed_courses, intake_term, major:major_id(major_name)")
      .eq("student_id", studentId)
      .single();
    if (student) {
      const majorName = student.major?.major_name || "Unassigned Major";
      const studentType = student.student_type || "Current";
      const completedList = student.completed_courses || [];
      const studentIdStr = student.student_id || String(studentId);
      const intakeYear = parseInt(studentIdStr.substring(0, 4)) || 2024;
      const intakeTerm = student.intake_term || "March";
      
      // Calculate semesters completed dynamically compared to current date
      const currentDate = new Date(); // Will resolve to July 2026 system date
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-indexed

      let semestersCompleted = 0;
      let iterYear = intakeYear;
      let iterTerm = intakeTerm;

      while (iterYear < currentYear || (iterYear === currentYear && (
        (iterTerm === "March" && currentMonth >= 7) || // March intake completes around July
        (iterTerm === "September" && currentMonth >= 1) // Sept intake completes around Jan
      ))) {
        semestersCompleted++;
        if (iterTerm === "March") {
          iterTerm = "September";
        } else {
          iterTerm = "March";
          iterYear++;
        }
      }

      // Determine upcoming calendar semester type (Korea Spring starts in March, Fall starts in Sept)
      const upcomingSem = (currentMonth >= 3 && currentMonth <= 8) ? "Fall" : "Spring";
      const upcomingSemTermStr = upcomingSem === "Fall" ? "2nd Semester" : "1st Semester";
      
      // Academic year student is entering in the upcoming semester
      const nextSemesterNumber = semestersCompleted + 1;
      const enteringYearNum = Math.min(4, Math.ceil(nextSemesterNumber / 2));
      const enteringYearStr = enteringYearNum === 1 ? "1st Year"
                            : enteringYearNum === 2 ? "2nd Year"
                            : enteringYearNum === 3 ? "3rd Year"
                            : "4th Year";

      const targetRecommendationLabel = `${enteringYearStr} - ${upcomingSemTermStr}`;

      let context = `Student Academic Background:\n` +
        `- Major: ${majorName}\n` +
        `- Academic Status: ${studentType === "Freshman" ? "Newly Admitted Freshman" : "Current Enrolled Student"}\n` +
        `- Intake Profile: Enrolled in ${intakeTerm} ${intakeYear}\n` +
        `- Completed semesters so far: ${semestersCompleted}\n` +
        `- Upcoming target semester: Entering ${enteringYearStr} (calendar ${upcomingSemTermStr} in the ${upcomingSem} semester)\n` +
        `- TARGETED RECOMMENDATION: When asked for course advice or recommendations for next semester, you MUST prioritize and suggest courses designed for **${targetRecommendationLabel}** in the curriculum for ${majorName}.\n`;
        
      if (studentType === "Freshman") {
        context += `- Note: Recommend only standard starting 1st semester courses.\n`;
      } else {
        context += `- Completed Courses (Taken already): ${completedList.length > 0 ? completedList.join(", ") : "None recorded"}. IMPORTANT: DO NOT recommend any courses listed as completed! Only recommend courses they have not taken yet.\n`;
      }
      return context;
    }
  } catch (err) {
    console.error("Failed to load academic context for AI:", err.message);
  }
  return "";
}


async function recommendMajor(req, res) {
  try {
    const {
      academicAreas = [],
      activities = [],
      strengths = [],
      careerAreas = [],
      learningStyles = [],
      topikLevel,
      topN = 3,
    } = req.body || {};

    const userProfile = {
      academicAreas,
      activities,
      strengths,
      careerAreas,
      learningStyles,
      topikLevel,
    };

    const requestedTopN = Number(topN);
    const safeTopN =
      Number.isInteger(requestedTopN) && requestedTopN > 0 ? requestedTopN : 3;

    const ruleBasedRecommendations = recommendMajors(
      userProfile,
      departmentProfiles,
      safeTopN,
    );

    let aiResult;
    let method = "rule-based";

    if (isOpenRouterConfigured()) {
      aiResult = await generateOpenRouterMajorAnalysis(
        userProfile,
        ruleBasedRecommendations,
      );
      method = aiResult.enabled ? "rule-based + openrouter" : "rule-based";
    } else if (isGeminiConfigured()) {
      aiResult = await generateGeminiMajorAnalysis(
        userProfile,
        ruleBasedRecommendations,
      );
      method = aiResult.enabled ? "rule-based + gemini" : "rule-based";
    } else {
      aiResult = await createClaudeMajorAnalysis(
        userProfile,
        ruleBasedRecommendations,
      );
      method = aiResult.enabled ? "rule-based + claude" : "rule-based";
    }

    const aiReasons = new Map(
      (aiResult.analysis?.recommendations || [])
        .filter((item) => item?.id && item?.claudeReason)
        .map((item) => [item.id, item.claudeReason]),
    );

    const recommendations = ruleBasedRecommendations.map((recommendation) => ({
      ...recommendation,
      claudeReason: aiReasons.get(recommendation.id) || null,
    }));

    return res.status(200).json({
      success: true,
      recommendationMethod: method,
      recommendations,
      aiAnalysis: aiResult.analysis,
      warning: aiResult.warning,
    });
  } catch (error) {
    console.error("Major recommendation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate major recommendations.",
    });
  }
}

// Predefined fallback responses for PNU campus life questions when Claude is not configured
const CAMPUS_FAQ = [
  {
    keywords: ["arc", "alien", "registration", "visa", "외국인등록증", "비자"],
    response:
      "To apply for your Alien Registration Card (ARC), you must visit the Busan Immigration Office within 90 days of your arrival. Required documents: Passport, 1 color photo (3.5x4.5cm), Certificate of Enrollment, fee (30,000 KRW), and proof of residence. You can make an appointment online at Hikorea.go.kr.",
  },
  {
    keywords: ["bank", "account", "nh", "card", "은행", "계좌"],
    response:
      "You can open a student bank account at the NH Bank (Nonghyup) branch located on the PNU campus (inside the Moonchang Hall or main administrative building). Bring your Passport, Certificate of Enrollment, and your ARC (if available).",
  },
  {
    keywords: [
      "insurance",
      "health",
      "medical",
      "보험",
      "의료",
      "국민건강보험",
    ],
    response:
      "All international students in Korea are automatically registered for the National Health Insurance Service (NHIS) once their alien registration is processed. The monthly fee is automatically billed. For details, visit the PNU International Office.",
  },
  {
    keywords: ["thesis", "graduation", "outline", "졸업", "논문"],
    response:
      "To graduate, you must submit your graduation thesis outline to your department office by the specified deadline (usually in October for the Fall semester, or April for the Spring semester). Check with your department academic advisor for outline templates.",
  },
  {
    keywords: ["topik", "korean", "certificate", "토픽", "한국어능력시험"],
    response:
      "PNU graduation requirements normally specify obtaining TOPIK Level 4 or above. You must submit your official TOPIK certificate to your department office before your final semester ends.",
  },
  {
    keywords: ["credit", "audit", "requirements", "학점"],
    response:
      "You must complete a credit audit to verify that your course credits meet your major requirements (usually 130+ total credits, including major required, elective, and general education). You can schedule a credit audit with your department advisor.",
  },
  {
    keywords: ["cafeteria", "food", "eat", "restaurant", "학식", "식당"],
    response:
      "Student cafeterias are located near the main library (Geumjeong Hall), Moonchang Hall, and the engineering building. Standard hours are 11:30 AM – 1:30 PM for lunch, and 5:30 PM – 7:00 PM for dinner on weekdays.",
  },
  {
    keywords: ["library", "study", "book", "도서관"],
    response:
      "The PNU Central Library is open daily for student study. You can access the library and check out books using your student ID card or mobile student ID app. Study room reservations can be made via the PNU Library app.",
  },
];

async function handleChat(req, res) {
  try {
    const { message } = req.body;
    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    let studentId = req.body.studentId;

    // Extract studentId from Bearer token in Authorization header
    if (!studentId && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        const token = parts[1];
        if (token.startsWith("mock-jwt-token-")) {
          studentId = token.replace("mock-jwt-token-", "");
        }
      }
    }

    // Prioritize history turns passed in the request body (supports client-side multi-session)
    let history = [];
    if (req.body.history && Array.isArray(req.body.history)) {
      history = req.body.history;
    } else {
      // Load recent history context (last 10 messages) if studentId is present
      const supabase = require("../supabaseClient");
      if (studentId) {
        try {
          const { data, error } = await supabase
            .from("chatbot_log")
            .select("*")
            .eq("student_id", studentId)
            .order("timestamp", { ascending: false })
            .limit(10);

          if (error) {
            console.error(
              "Failed to load chat history for context:",
              error.message,
            );
          } else if (data) {
            // Re-sort chronological order and map to turns
            history = [...data].reverse().map((log) => ({
              question: log.question,
              answer: log.answer,
            }));
          }
        } catch (histErr) {
          console.error(
            "Error loading chat history for context:",
            histErr.message,
          );
        }
      }
    }

    let userLangPref = "EN";
    let filters = { country: "ALL", gender: "ALL" };
    if (studentId) {
      try {
        const { data: student } = await supabase
          .from("student")
          .select("language_pref, nationality")
          .eq("student_id", studentId)
          .single();
        if (student) {
          if (student.language_pref) userLangPref = student.language_pref;
          if (student.nationality) filters.country = student.nationality;
        }
      } catch (err) {
        console.error("Failed to load language/nationality for AI chat:", err.message);
      }
    }

    const academicPromptContext = await getAcademicPromptContext(studentId, supabase);

    // Retrieve grounding context from Vector RAG system
    let context = "";
    try {
      context = await ragService.retrieveContext(message, filters, 3);
    } catch (ragErr) {
      console.error("RAG context retrieval failed:", ragErr.message);
    }

    let reply = null;

    // 1. If OpenRouter is configured in .env, call OpenRouter for real AI chat!
    if (isOpenRouterConfigured()) {
      try {
        let augmentedMsg = "";
        if (academicPromptContext) {
          augmentedMsg += `${academicPromptContext}\n`;
        }
        if (context) {
          augmentedMsg += `PNU Knowledge Base Context:\n${context}\n\n`;
        }
        augmentedMsg += `User Question: ${message}`;

        reply = await generateOpenRouterChat(augmentedMsg, history);
      } catch (orErr) {
        console.error(
          "OpenRouter Chat Error, falling back to Gemini/Claude/FAQ:",
          orErr.message,
        );
      }
    }

    // 2. If Gemini is configured in .env, call Gemini for real AI chat!
    if (!reply && isGeminiConfigured()) {
      try {
        let geminiMsg = message;
        if (academicPromptContext) {
          geminiMsg = `${academicPromptContext}\n${geminiMsg}`;
        }
        reply = await generateGeminiChat(geminiMsg, userLangPref, context);
      } catch (geminiErr) {
        console.error(
          "Gemini Chat Error, falling back to Claude/FAQ:",
          geminiErr.message,
        );
      }
    }

    // 3. If Anthropic/Claude is configured in .env, call Claude for real AI chat!
    if (!reply && process.env.ANTHROPIC_API_KEY && process.env.CLAUDE_MODEL) {
      try {
        const Anthropic = require("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await client.messages.create({
          model: process.env.CLAUDE_MODEL,
          max_tokens: 300,
          system:
            "You are the Hey! PNU Smart Assistant, an AI helper for international students at Pusan National University. Keep your responses short (under 4 sentences), friendly, helpful, and focused on PNU campus life, academics, or settlement requirements. Answer in the same language the student asks in.",
          messages: [{ role: "user", content: message }],
        });

        reply = response.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("");
      } catch (claudeErr) {
        console.error(
          "Claude Chat Error, falling back to local FAQ:",
          claudeErr.message,
        );
      }
    }

    // 4. Fallback: Smart keyword matching
    if (!reply) {
      const lowerMsg = message.toLowerCase();
      for (const faq of CAMPUS_FAQ) {
        const match = faq.keywords.some((keyword) =>
          lowerMsg.includes(keyword),
        );
        if (match) {
          reply = faq.response;
          break;
        }
      }
    }

    // 5. Default general assistant response if no keyword matches
    if (!reply) {
      reply =
        "I'm the Hey! PNU Assistant. I can help you with campus inquiries such as ARC application, bank accounts, health insurance, thesis outline submissions, TOPIK requirements, library access, and cafeterias. Please ask about any of these topics!";
    }

    // Save the conversation turn to the database if studentId is present
    if (studentId) {
      try {
        const { error: insertError } = await supabase
          .from("chatbot_log")
          .insert({
            student_id: studentId,
            question: message,
            answer: reply,
            timestamp: new Date().toISOString(),
          });

        if (insertError) {
          console.error(
            "Failed to save chatbot log in database:",
            insertError.message,
          );
        }
      } catch (dbErr) {
        console.error("Error saving chatbot log in database:", dbErr.message);
      }
    }

    return res.json({ success: true, reply });
  } catch (err) {
    console.error("Chat controller error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getChatHistory(req, res) {
  try {
    const { student_id } = req.params;
    if (!student_id) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID is required" });
    }

    const supabase = require("../supabaseClient");

    // Fetch logs ordered by timestamp ascending (chronological order)
    const { data, error } = await supabase
      .from("chatbot_log")
      .select("*")
      .eq("student_id", student_id)
      .order("timestamp", { ascending: true });

    if (error) {
      console.error(
        "Error fetching chat history from Supabase:",
        error.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch chat history" });
    }

    return res.json({ success: true, history: data || [] });
  } catch (err) {
    console.error("Chat history controller error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function clearChatHistory(req, res) {
  try {
    const { student_id } = req.params;
    if (!student_id) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID is required" });
    }

    const supabase = require("../supabaseClient");
    const { error } = await supabase
      .from("chatbot_log")
      .delete()
      .eq("student_id", student_id);

    if (error) {
      console.error(
        "Error clearing chat history from Supabase:",
        error.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Failed to clear chat history" });
    }

    return res.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (err) {
    console.error("Clear chat history error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function translateAnnouncement(req, res) {
  try {
    const { imageBase64, mimeType, textContent } = req.body;

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Gemini translation service is not configured.",
      });
    }

    if (!imageBase64 && !textContent) {
      return res.status(400).json({
        success: false,
        message: "Missing raw text or base64 image payload to translate.",
      });
    }

    const result = await translateGeminiAnnouncement(
      imageBase64,
      mimeType,
      textContent,
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Translation controller error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to translate announcement",
      error: err.message,
    });
  }
}

async function handleChatStream(req, res) {
  try {
    const { message, languagePref = "EN" } = req.body || {};
    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    if (!isGeminiConfigured() && !isOpenRouterConfigured()) {
      // Fallback: send matching FAQ or fallback text streamed back to UI
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const fallbackText =
        "AI is not configured yet. PNU Smart Assistant is running in mockup mode.";
      const words = fallbackText.split(" ");
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + " " })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    const studentId = req.user?.student_id;
    let userLangPref = languagePref;
    let filters = { country: "ALL", gender: "ALL" };

    if (studentId) {
      try {
        const { data: student } = await supabase
          .from("student")
          .select("language_pref, nationality")
          .eq("student_id", studentId)
          .single();
        if (student) {
          if (student.language_pref) userLangPref = student.language_pref;
          if (student.nationality) filters.country = student.nationality;
        }
      } catch (err) {
        console.error("Failed to load student details for chat stream:", err.message);
      }
    }

    const academicPromptContext = await getAcademicPromptContext(studentId, supabase);

    // Retrieve grounding context from Vector RAG system
    let context = "";
    try {
      context = await ragService.retrieveContext(message, filters, 3);
    } catch (ragErr) {
      console.error("RAG context retrieval failed for stream:", ragErr.message);
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (isOpenRouterConfigured()) {
      let augmentedMsg = "";
      if (academicPromptContext) {
        augmentedMsg += `${academicPromptContext}\n`;
      }
      if (context) {
        augmentedMsg += `PNU Knowledge Base Context:\n${context}\n\n`;
      }
      augmentedMsg += `User Question: ${message}`;

      let history = [];
      if (req.body.history && Array.isArray(req.body.history)) {
        history = req.body.history;
      } else if (studentId) {
        try {
          const { data: logs } = await supabase
            .from("chatbot_log")
            .select("*")
            .eq("student_id", studentId)
            .order("timestamp", { ascending: false })
            .limit(10);
          if (logs) {
            history = [...logs].reverse().map((log) => ({
              question: log.question,
              answer: log.answer,
            }));
          }
        } catch (histErr) {
          console.error("Failed to load history for OpenRouter stream:", histErr.message);
        }
      }

      const stream = await generateOpenRouterChatStream(augmentedMsg, history);
      const decoder = new TextDecoder();
      let buffer = "";

      for await (const chunk of stream) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            const rawJson = trimmed.slice(6);
            try {
              const parsed = JSON.parse(rawJson);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              }
            } catch {
              // ignore partial line parsing issues
            }
          }
        }
      }

      if (buffer.trim().startsWith("data: ")) {
        const rawJson = buffer.trim().slice(6);
        try {
          const parsed = JSON.parse(rawJson);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
          }
        } catch {}
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      let geminiMsg = message;
      if (academicPromptContext) {
        geminiMsg = `${academicPromptContext}\n${geminiMsg}`;
      }
      const stream = await generateGeminiChatStream(geminiMsg, userLangPref, context);
      let buffer = "";
      const decoder = new TextDecoder();

      for await (const chunk of stream) {
        buffer += decoder.decode(chunk, { stream: true });
        const textRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
        let match;
        while ((match = textRegex.exec(buffer)) !== null) {
          const rawText = match[1];
          try {
            const cleanText = JSON.parse(`"${rawText}"`);
            res.write(`data: ${JSON.stringify({ text: cleanText })}\n\n`);
          } catch {
            // ignore parsing error
          }
        }
        buffer = buffer.slice(-100);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (err) {
    console.error("AI Streaming error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

async function getAllDocuments(req, res) {
  try {
    const { data, error } = await supabase
      .from("kb_document")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getDocument(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("kb_document")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createDocument(req, res) {
  try {
    const { category, title, content, target_country = 'ALL', target_gender = 'ALL' } = req.body;
    if (!category || !title || !content) {
      return res.status(400).json({ success: false, message: "Category, title, and content are required." });
    }

    const { data, error } = await supabase
      .from("kb_document")
      .insert({ category, title, content, target_country, target_gender })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Automatically sync vector chunks
    try {
      await ragService.syncDocument(data.id);
    } catch (syncErr) {
      console.error(`Auto-sync failed for document ${data.id}:`, syncErr.message);
      return res.json({ success: true, data, warning: "Document saved, but vector sync failed: " + syncErr.message });
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateDocument(req, res) {
  try {
    const { id } = req.params;
    const { category, title, content, target_country, target_gender } = req.body;

    const updates = {};
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (target_country !== undefined) updates.target_country = target_country;
    if (target_gender !== undefined) updates.target_gender = target_gender;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("kb_document")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Recalculate and sync vector chunks
    try {
      await ragService.syncDocument(id);
    } catch (syncErr) {
      console.error(`Auto-sync failed for document ${id}:`, syncErr.message);
      return res.json({ success: true, data, warning: "Document updated, but vector sync failed: " + syncErr.message });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    // Delete chunks first (Supabase has cascade delete, but we do it manually for emulated/double safety)
    const { error: deleteChunksError } = await supabase
      .from("kb_chunk")
      .delete()
      .eq("document_id", id);

    if (deleteChunksError) {
      console.warn("Cascade delete chunks failed:", deleteChunksError.message);
    }

    const { error } = await supabase
      .from("kb_document")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: "Document deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function syncDocumentVector(req, res) {
  try {
    const { id } = req.params;
    const result = await ragService.syncDocument(id);
    res.json({ success: true, message: `Successfully synced ${result.chunksCount} chunks.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  recommendMajor,
  handleChat,
  handleChatStream,
  getChatHistory,
  clearChatHistory,
  translateAnnouncement,
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  syncDocumentVector,
};
