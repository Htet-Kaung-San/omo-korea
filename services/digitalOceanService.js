function isDigitalOceanConfigured() {
  return Boolean(process.env.DIGITALOCEAN_API_KEY);
}

async function generateDigitalOceanChat(message, history = []) {
  if (!isDigitalOceanConfigured()) {
    throw new Error("DigitalOcean API key is not configured");
  }

  const url = "https://inference.do-ai.run/v1/chat/completions";
  const systemInstruction =
    "You are the Hey! PNU Smart Assistant, an AI helper for international students at Pusan National University. Keep your responses short (under 4 sentences), friendly, helpful, and focused on PNU campus life, academics, or settlement requirements. Answer in the same language the student asks in. IMPORTANT: The user's profile details (Major, completed semesters, intake term) are already provided above in 'Student Academic Background'. Do NOT ask the user what their major, year, or completed semesters are under any circumstances; use the provided context to answer directly.";

  const messagesPayload = [];

  if (history && history.length > 0) {
    history.forEach((turn, idx) => {
      let userText = turn.question;
      if (idx === 0) {
        userText = `${systemInstruction}\n\nUser Question: ${userText}`;
      }
      messagesPayload.push({ role: "user", content: userText });
      messagesPayload.push({ role: "assistant", content: turn.answer });
    });
    messagesPayload.push({ role: "user", content: message });
  } else {
    messagesPayload.push({
      role: "user",
      content: `${systemInstruction}\n\nUser Question: ${message}`,
    });
  }

  const modelConfig = [
    { id: "llama3.3-70b-instruct", timeout: 8000 },
    { id: "deepseek-r1-distill-llama-70b", timeout: 12000 },
  ];

  let lastError = null;

  for (const { id: model, timeout } of modelConfig) {
    try {
      console.log(`Attempting DigitalOcean chat with model: ${model}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DIGITALOCEAN_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messagesPayload,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status} (${response.statusText})`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "DigitalOcean returned error object");
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text || text.trim() === "") {
        throw new Error("Empty response from model");
      }

      const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (!cleanedText) {
        throw new Error("Response only contained thinking tags");
      }

      console.log(`Successfully generated chat response using DigitalOcean model: ${model}`);
      return cleanedText;
    } catch (err) {
      console.error(`DigitalOcean Chat failed with model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All DigitalOcean models failed. Last error: ${lastError ? lastError.message : "Unknown"}`);
}

async function generateDigitalOceanMajorAnalysis(userProfile, recommendations) {
  if (!isDigitalOceanConfigured()) {
    return {
      enabled: false,
      analysis: null,
      warning: "DigitalOcean is not configured yet.",
    };
  }

  const url = "https://inference.do-ai.run/v1/chat/completions";
  const prompt = `
You are the major recommendation assistant for Hey! PNU, a support platform for international students at Pusan National University.
Use only the supplied questionnaire data and rule-based recommendations.
Do not guarantee admission, scholarship eligibility, or graduation outcomes.
Treat the eligibility notes as reminders, not final admission decisions.

Input Profile: ${JSON.stringify(userProfile)}
Rule-based Recommendations: ${JSON.stringify(recommendations)}

Return valid JSON ONLY matching this format (no markdown blocks, no prefix/suffix):
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

  const modelConfig = [
    { id: "llama3.3-70b-instruct", timeout: 10000 },
    { id: "deepseek-r1-distill-llama-70b", timeout: 14000 },
  ];

  let lastError = null;

  for (const { id: model, timeout } of modelConfig) {
    try {
      console.log(`Attempting DigitalOcean major analysis with model: ${model}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const payload = {
        model: model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DIGITALOCEAN_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status} (${response.statusText})`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "DigitalOcean returned error object");
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Empty response from model");
      }

      const cleanedText = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();

      const parsedJSON = JSON.parse(cleanedText);

      console.log(`Successfully generated major analysis using DigitalOcean model: ${model}`);
      return {
        enabled: true,
        analysis: parsedJSON,
        warning: null,
      };
    } catch (error) {
      console.error(`DigitalOcean major recommendation failed with model ${model}:`, error.message);
      lastError = error;
    }
  }

  return {
    enabled: false,
    analysis: null,
    warning: `DigitalOcean major recommendations are temporarily unavailable. Last error: ${lastError ? lastError.message : "Unknown"}`,
  };
}

async function generateDigitalOceanChatStream(message, history = [], modelOverride = null, imageBase64 = null, systemContext = "") {
  if (!isDigitalOceanConfigured()) {
    throw new Error("DigitalOcean API key is not configured");
  }

  const url = "https://inference.do-ai.run/v1/chat/completions";
  const systemInstruction =
    "You are the Hey! PNU Smart Assistant, an AI helper for international students at Pusan National University. Keep your responses short (under 4 sentences), friendly, helpful, and focused on PNU campus life, academics, or settlement requirements. Answer in the same language the student asks in. IMPORTANT: The user's profile details (Major, completed semesters, intake term) are already provided above in 'Student Academic Background'. Do NOT ask the user what their major, year, or completed semesters are under any circumstances; use the provided context to answer directly.";

  const messagesPayload = [];
  
  // Create a clean system message that contains the base instructions PLUS any RAG/academic context
  const fullSystemPrompt = `${systemInstruction}\n\n${systemContext}`;
  messagesPayload.push({ role: "system", content: fullSystemPrompt.trim() });
  
  if (history && history.length > 0) {
    history.forEach((turn) => {
      messagesPayload.push({ role: "user", content: turn.question });
      messagesPayload.push({ role: "assistant", content: turn.answer });
    });
  }

  // Handle the latest message, potentially with an image
  let finalMessageContent;
  let preferredModel = modelOverride || process.env.DIGITALOCEAN_MODEL || "deepseek-v4-pro";
  
  if (imageBase64) {
    // If there is an image, we MUST use a vision-capable model
    preferredModel = "deepseek-v4-pro"; // Deepseek V4 Pro natively supports multimodal vision
    finalMessageContent = [
      { type: "text", text: message },
      { type: "image_url", image_url: { url: imageBase64 } }
    ];
  } else {
    finalMessageContent = message;
  }

  messagesPayload.push({ role: "user", content: finalMessageContent });

  const fallbackModels = [preferredModel, "openai-gpt-4o-mini", "llama3.3-70b-instruct"];

  let lastError = null;

  for (const model of fallbackModels) {
    try {
      console.log(`Attempting DigitalOcean stream with model: ${model}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DIGITALOCEAN_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messagesPayload,
          stream: true,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      return response.body;
    } catch (err) {
      console.error(`DigitalOcean stream failed with model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All DigitalOcean stream models failed. Last error: ${lastError ? lastError.message : "Unknown"}`);
}

module.exports = {
  isDigitalOceanConfigured,
  generateDigitalOceanChat,
  generateDigitalOceanChatStream,
  generateDigitalOceanMajorAnalysis,
};
