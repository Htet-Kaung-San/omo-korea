const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

async function generateOpenRouterChat(message, history = []) {
  if (!isOpenRouterConfigured()) {
    throw new Error("OpenRouter API key is not configured");
  }

  const url = "https://openrouter.ai/api/v1/chat/completions";
  const systemInstruction =
    "You are the Hey! PNU Smart Assistant, an AI helper for international students at Pusan National University. Keep your responses short (under 4 sentences), friendly, helpful, and focused on PNU campus life, academics, or settlement requirements. Answer in the same language the student asks in.";

  // Format the messages payload including context history turns
  const messagesPayload = [];

  if (history && history.length > 0) {
    history.forEach((turn, idx) => {
      let userText = turn.question;
      if (idx === 0) {
        // Prefix first message in history with system instructions
        userText = `${systemInstruction}\n\nUser Question: ${userText}`;
      }
      messagesPayload.push({ role: "user", content: userText });
      messagesPayload.push({ role: "assistant", content: turn.answer });
    });

    // Append current user message
    messagesPayload.push({ role: "user", content: message });
  } else {
    // No history, just standard merged prompt
    messagesPayload.push({
      role: "user",
      content: `${systemInstruction}\n\nUser Question: ${message}`,
    });
  }

  // Configured with exact active free model IDs and their respective custom timeouts
  const modelConfig = [
    { id: "google/gemma-4-31b-it:free", timeout: 7000 },
    { id: "meta-llama/llama-3.2-3b-instruct:free", timeout: 6000 },
    { id: "qwen/qwen3-next-80b-a3b-instruct:free", timeout: 8000 },
    { id: "meta-llama/llama-3.3-70b-instruct:free", timeout: 8000 },
    { id: "openrouter/free", timeout: 12000 },
  ];

  let lastError = null;

  for (const { id: model, timeout } of modelConfig) {
    try {
      console.log(
        `Attempting OpenRouter chat with model: ${model} (timeout: ${timeout}ms)`,
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://localhost:3000",
          "X-Title": "Hey! PNU",
        },
        body: JSON.stringify({
          model: model,
          messages: messagesPayload,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP status ${response.status} (${response.statusText})`,
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(
          data.error.message || "OpenRouter returned error object",
        );
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text || text.trim() === "") {
        throw new Error("Empty response from model");
      }

      // Strip reasoning tags (<think>...</think>) if present
      const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (!cleanedText) {
        throw new Error("Response only contained thinking tags");
      }

      console.log(`Successfully generated chat response using model: ${model}`);
      return cleanedText;
    } catch (err) {
      console.error(`OpenRouter Chat failed with model ${model}:`, err.message);
      lastError = err;
      // Fallback to next model
    }
  }

  throw new Error(
    `All OpenRouter models failed. Last error: ${lastError ? lastError.message : "Unknown"}`,
  );
}

async function generateOpenRouterMajorAnalysis(userProfile, recommendations) {
  if (!isOpenRouterConfigured()) {
    return {
      enabled: false,
      analysis: null,
      warning: "OpenRouter is not configured yet.",
    };
  }

  const url = "https://openrouter.ai/api/v1/chat/completions";
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

  // Configured with exact active free model IDs and their respective custom timeouts
  const modelConfig = [
    { id: "google/gemma-4-31b-it:free", timeout: 9000 },
    { id: "qwen/qwen3-next-80b-a3b-instruct:free", timeout: 10000 },
    { id: "meta-llama/llama-3.3-70b-instruct:free", timeout: 10000 },
    { id: "meta-llama/llama-3.2-3b-instruct:free", timeout: 8000 },
    { id: "openrouter/free", timeout: 14000 },
  ];

  let lastError = null;

  for (const { id: model, timeout } of modelConfig) {
    try {
      console.log(
        `Attempting OpenRouter major analysis with model: ${model} (timeout: ${timeout}ms)`,
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const payload = {
        model: model,
        messages: [{ role: "user", content: prompt }],
      };

      // Only add response_format if the model natively supports JSON mode
      if (
        model.includes("llama") ||
        model.includes("qwen") ||
        model.includes("gemma")
      ) {
        payload.response_format = { type: "json_object" };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://localhost:3000",
          "X-Title": "Hey! PNU",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP status ${response.status} (${response.statusText})`,
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(
          data.error.message || "OpenRouter returned error object",
        );
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Empty response from model");
      }

      const cleanedText = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "") // Strip reasoning tags
        .trim();

      const parsedJSON = JSON.parse(cleanedText);

      console.log(
        `Successfully generated major analysis using model: ${model}`,
      );
      return {
        enabled: true,
        analysis: parsedJSON,
        warning: null,
      };
    } catch (error) {
      console.error(
        `OpenRouter major recommendation failed with model ${model}:`,
        error.message,
      );
      lastError = error;
      // Fallback to next model
    }
  }

  return {
    enabled: false,
    analysis: null,
    warning: `OpenRouter major recommendations are temporarily unavailable. Last error: ${lastError ? lastError.message : "Unknown"}`,
  };
}

module.exports = {
  isOpenRouterConfigured,
  generateOpenRouterChat,
  generateOpenRouterMajorAnalysis,
};
