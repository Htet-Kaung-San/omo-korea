const departmentProfiles = require("../ai/departmentProfiles");
const { recommendMajors } = require("../ai/recommendationEngine");
const {
  createClaudeMajorAnalysis,
} = require("../services/claudeMajorRecommendationService");
const {
  isGeminiConfigured,
  generateGeminiChat,
  generateGeminiMajorAnalysis,
  translateGeminiAnnouncement,
} = require("../services/geminiService");
const {
  isOpenRouterConfigured,
  generateOpenRouterChat,
  generateOpenRouterMajorAnalysis,
} = require("../services/openrouterService");

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
    if (studentId) {
      try {
        const supabase = require("../supabaseClient");
        const { data: student } = await supabase
          .from("student")
          .select("language_pref")
          .eq("student_id", studentId)
          .single();
        if (student && student.language_pref) {
          userLangPref = student.language_pref;
        }
      } catch (err) {
        console.error("Failed to load language pref for AI chat:", err.message);
      }
    }

    let reply = null;

    // 1. If OpenRouter is configured in .env, call OpenRouter for real AI chat!
    if (isOpenRouterConfigured()) {
      try {
        reply = await generateOpenRouterChat(message, history);
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
        reply = await generateGeminiChat(message, userLangPref);
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

module.exports = {
  recommendMajor,
  handleChat,
  getChatHistory,
  clearChatHistory,
  translateAnnouncement,
};
