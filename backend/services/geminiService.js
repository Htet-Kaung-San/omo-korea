const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function generateGeminiChat(message, languagePref, context) {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const langName =
    languagePref === "KO"
      ? "Korean"
      : languagePref === "ZH"
        ? "Chinese (Simplified)"
        : "English";
  let systemInstruction = `You are the Hey! PNU Smart Assistant, an AI helper for international students at Pusan National University. Keep your responses short (under 4 sentences), friendly, helpful, and focused on PNU campus life, academics, or settlement requirements. Respond in ${langName}. IMPORTANT: The user's profile details (Major, completed semesters, intake term) are already provided above in 'Student Academic Background'. Do NOT ask the user what their major, year, or completed semesters are under any circumstances; use the provided context to answer directly.`;

  if (context) {
    systemInstruction += `\n\nUse the following verified PNU reference context to answer the user's question. If the question cannot be answered using this context, reply using your general knowledge but mention it is not from official PNU documentation:\n\n${context}`;
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return text;
}

async function generateGeminiMajorAnalysis(userProfile, recommendations) {
  if (!isGeminiConfigured()) {
    return {
      enabled: false,
      analysis: null,
      warning:
        "Gemini is not configured yet. Rule-based recommendations are being used.",
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = `
You are the major recommendation assistant for Hey! PNU, a support platform for international students at Pusan National University.
Use only the supplied questionnaire data and rule-based recommendations.
Do not guarantee admission, scholarship eligibility, or graduation outcomes.
Treat the eligibility notes as reminders, not final admission decisions.

Input Profile: ${JSON.stringify(userProfile)}
Rule-based Recommendations: ${JSON.stringify(recommendations)}

Return valid JSON ONLY matching this format:
{
  "summary": "short overall recommendation summary",
  "gapAnalysis": [
    "one practical area the student can strengthen",
    "another practical area the student can strengthen"
  ],
  "recommendations": [
    {
      "id": "department id from the input",
      "claudeReason": "short, specific explanation"
    }
  ]
}
  `.trim();

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    return {
      enabled: true,
      analysis: JSON.parse(cleanedText),
      warning: null,
    };
  } catch (error) {
    console.error("Gemini major recommendation error:", error.message);
    return {
      enabled: false,
      analysis: null,
      warning: "Gemini analysis is temporarily unavailable.",
    };
  }
}

async function translateGeminiAnnouncement(imageBase64, mimeType, textContent) {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const systemPrompt = `
You are the Hey! PNU Academic and Settlement Notice Translator.
Your job is to translate Pusan National University Korean announcements into clear English, and extract key action-items and deadlines.

Please return JSON ONLY matching the following schema:
{
  "translatedTitle": "Clear, concise translated title in English",
  "translation": "Paragraph-by-paragraph translation or detail summary in English",
  "deadlines": [
    "Key date/deadline 1 (e.g. 2026-08-10: Enrollment begins)",
    "Key date/deadline 2 (e.g. 2026-09-01: Document submission)"
  ],
  "actionItems": [
    "Practical action item for the student 1",
    "Practical action item for the student 2"
  ]
}
`;

  const parts = [];

  if (imageBase64 && mimeType) {
    const base64Data = imageBase64.includes("base64,")
      ? imageBase64.split("base64,")[1]
      : imageBase64;

    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    });
    parts.push({
      text: `${systemPrompt}\n\nPlease translate this announcement image. Explain any dates and required steps.`,
    });
  } else {
    parts.push({
      text: `${systemPrompt}\n\nAnnouncement Text:\n${textContent || ""}\n\nPlease translate this text announcement.`,
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const cleanedText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleanedText);
}

const CAFETERIA_LANGUAGE_NAMES = {
  en: "English",
  ko: "Korean",
  zh: "Chinese (Simplified)",
  th: "Thai",
  bn: "Bengali",
  mn: "Mongolian",
  vi: "Vietnamese",
  hi: "Hindi",
  kk: "Kazakh",
  id: "Indonesian",
  fa: "Persian",
  uz: "Uzbek",
  ja: "Japanese",
  my: "Burmese",
  ur: "Urdu",
  ru: "Russian",
  am: "Amharic",
  tr: "Turkish",
  es: "Spanish",
};

const cafeteriaTranslationCache = new Map();
const CAFETERIA_TRANSLATION_TTL_MS = 1000 * 60 * 60; // 1 hour

function collectCafeteriaStrings(cafeterias = []) {
  const strings = new Set();

  const add = (value) => {
    const text = String(value || "").trim();
    if (!text) return;
    // Skip pure punctuation / placeholders
    if (text === "-" || text === "·") return;
    strings.add(text);
  };

  for (const hall of cafeterias) {
    add(hall?.name);
    const menu = hall?.menu;
    if (!menu) continue;
    add(menu.week_label);

    for (const row of menu.rows || []) {
      add(row.meal_type);
      for (const line of String(row.meal_label || "").split("\n")) {
        add(line);
      }

      for (const column of row.columns || []) {
        add(column.day_label);
        add(column.note);
        add(column.price);
        for (const item of column.items || []) add(item);

        for (const option of column.options || []) {
          add(option.price);
          for (const item of option.items || []) add(item);
        }
      }
    }
  }

  return [...strings];
}

function applyCafeteriaTranslations(cafeterias = [], dictionary = {}) {
  const translate = (value) => {
    if (value == null) return value;
    const text = String(value);
    if (!text.trim()) return value;
    return dictionary[text] ?? dictionary[text.trim()] ?? value;
  };

  return cafeterias.map((hall) => {
    const menu = hall.menu;
    if (!menu) {
      return { ...hall, name: translate(hall.name) };
    }

    return {
      ...hall,
      name: translate(hall.name),
      menu: {
        ...menu,
        week_label: translate(menu.week_label),
        rows: (menu.rows || []).map((row) => ({
          ...row,
          meal_type: translate(row.meal_type),
          meal_label: String(row.meal_label || "")
            .split("\n")
            .map((line) => translate(line))
            .join("\n"),
          columns: (row.columns || []).map((column) => {
            const options = (column.options || []).map((option) => ({
              ...option,
              price: translate(option.price),
              items: (option.items || []).map((item) => translate(item)),
            }));

            return {
              ...column,
              day_label: translate(column.day_label),
              note: translate(column.note),
              price: translate(column.price),
              items: (column.items || []).map((item) => translate(item)),
              options,
            };
          }),
        })),
      },
    };
  });
}

function parseGeminiJson(text) {
  const cleanedText = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleanedText);
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function requestCafeteriaTranslationsViaOpenRouter(strings, langName) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  const url = "https://openrouter.ai/api/v1/chat/completions";
  const preferredModel = process.env.OPENROUTER_MODEL;
  const models = [
    ...(preferredModel ? [preferredModel] : []),
    "google/gemini-2.5-flash",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter/free",
  ];

  const prompt = `
You are translating a Pusan National University (PNU) cafeteria weekly menu for international students.
Translate each Korean string into natural ${langName}.

Rules:
- Return JSON ONLY: { "translations": { "<exact source string>": "<translated string>", ... } }
- Keep every source string as an exact key (do not drop or rename keys).
- Translate dish names, meal labels (조식/중식/석식), option titles (정식/일품), hall names, and notes.
- Keep numbers, times (e.g. 11:00~14:00), and prices readable (e.g. keep "5,000원" or use "5,000 won").
- Do not invent dishes. Do not add explanations.

Source strings:
${JSON.stringify(strings, null, 2)}
`.trim();

  let lastError = null;
  for (const model of models) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://localhost:3000",
          "X-Title": "Hey! PNU Cafeteria Translation",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `${model}: ${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 160)}` : ""}`,
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || `${model}: OpenRouter error`);
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error(`${model}: empty response`);
      }

      const parsed = parseGeminiJson(text);
      if (parsed && typeof parsed.translations === "object" && parsed.translations) {
        return parsed.translations;
      }
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
      throw new Error(`${model}: unexpected JSON shape`);
    } catch (error) {
      lastError = error;
      console.warn(
        "[geminiService] OpenRouter cafeteria model failed:",
        error.message,
      );
    }
  }

  throw lastError || new Error("OpenRouter cafeteria translation failed");
}

async function requestCafeteriaTranslations(strings, langName, { retries = 1 } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = `
You are translating a Pusan National University (PNU) cafeteria weekly menu for international students.
Translate each Korean string into natural ${langName}.

Rules:
- Return JSON ONLY: { "translations": { "<exact source string>": "<translated string>", ... } }
- Keep every source string as an exact key (do not drop or rename keys).
- Translate dish names, meal labels (조식/중식/석식), option titles (정식/일품), hall names, and notes.
- Keep numbers, times (e.g. 11:00~14:00), and prices readable (e.g. keep "5,000원" or use "5,000 won").
- Do not invent dishes. Do not add explanations.
- If a string is already in ${langName} or is only numbers/punctuation, return it unchanged.

Source strings:
${JSON.stringify(strings, null, 2)}
`.trim();

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (response.status === 429) {
        lastError = new Error("Gemini API error: Too Many Requests");
        break;
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      const parsed = parseGeminiJson(text);
      if (parsed && typeof parsed.translations === "object" && parsed.translations) {
        return parsed.translations;
      }
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
      return {};
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }

  // Fallback when Gemini is rate-limited / unavailable
  try {
    console.warn(
      "[geminiService] Falling back to OpenRouter for cafeteria translation:",
      lastError?.message || "unknown Gemini error",
    );
    return await requestCafeteriaTranslationsViaOpenRouter(strings, langName);
  } catch (fallbackError) {
    console.warn(
      "[geminiService] OpenRouter cafeteria translation failed:",
      fallbackError.message,
    );
    throw lastError || fallbackError;
  }
}

/**
 * Real-time AI translation for cafeteria menus (Korean source → target language).
 * Returns `{ cafeterias, translated }` — falls back to Korean on failure.
 *
 * @param {Array} cafeterias
 * @param {string} targetLanguage ISO language code (e.g. en, vi, my)
 * @param {string} [cacheSalt] stable key fragment (e.g. scraped_at / menu_date)
 */
async function translateCafeteriaMenus(cafeterias, targetLanguage = "en", cacheSalt = "") {
  const lang = String(targetLanguage || "en").toLowerCase().split("-")[0];
  if (!Array.isArray(cafeterias) || cafeterias.length === 0) {
    return { cafeterias, translated: false };
  }
  if (lang === "ko") {
    return { cafeterias, translated: false };
  }
  if (!isGeminiConfigured() && !process.env.OPENROUTER_API_KEY) {
    return { cafeterias, translated: false };
  }

  const strings = collectCafeteriaStrings(cafeterias);
  if (strings.length === 0) {
    return { cafeterias, translated: false };
  }

  const cacheKey = `${lang}:${cacheSalt || "current"}:${strings.length}`;
  const cached = cafeteriaTranslationCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CAFETERIA_TRANSLATION_TTL_MS) {
    return {
      cafeterias: applyCafeteriaTranslations(cafeterias, cached.dictionary),
      translated: true,
    };
  }

  const langName = CAFETERIA_LANGUAGE_NAMES[lang] || "English";

  try {
    const dictionary = {};
    const batches = chunkArray(strings, 40);
    for (let i = 0; i < batches.length; i += 1) {
      const partial = await requestCafeteriaTranslations(batches[i], langName);
      Object.assign(dictionary, partial);
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (Object.keys(dictionary).length === 0) {
      return { cafeterias, translated: false };
    }

    cafeteriaTranslationCache.set(cacheKey, {
      fetchedAt: Date.now(),
      dictionary,
    });

    return {
      cafeterias: applyCafeteriaTranslations(cafeterias, dictionary),
      translated: true,
    };
  } catch (error) {
    console.warn(
      "[geminiService] Cafeteria menu translation failed:",
      error.message,
    );
    return { cafeterias, translated: false };
  }
}

async function generateGeminiChatStream(message, languagePref, context) {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`;

  const langName =
    languagePref === "KO"
      ? "Korean"
      : languagePref === "ZH"
        ? "Chinese (Simplified)"
        : "English";
  let systemInstruction = `You are the Hey! PNU Smart Assistant, an AI helper for international students at Pusan National University. Keep your responses short (under 4 sentences), friendly, helpful, and focused on PNU campus life, academics, or settlement requirements. Respond in ${langName}. IMPORTANT: The user's profile details (Major, completed semesters, intake term) are already provided above in 'Student Academic Background'. Do NOT ask the user what their major, year, or completed semesters are under any circumstances; use the provided context to answer directly.`;

  if (context) {
    systemInstruction += `\n\nUse the following verified PNU reference context to answer the user's question. If the question cannot be answered using this context, reply using your general knowledge but mention it is not from official PNU documentation:\n\n${context}`;
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  return response.body;
}

module.exports = {
  isGeminiConfigured,
  generateGeminiChat,
  generateGeminiChatStream,
  generateGeminiMajorAnalysis,
  translateGeminiAnnouncement,
  translateCafeteriaMenus,
};
