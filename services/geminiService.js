const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function generateGeminiChat(message, languagePref) {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const langName = languagePref === 'KO' ? 'Korean' : (languagePref === 'ZH' ? 'Chinese (Simplified)' : 'English');
  const systemInstruction = `You are the Hey! PNU Smart Assistant, an AI helper for international students at Pusan National University. Keep your responses short (under 4 sentences), friendly, helpful, and focused on PNU campus life, academics, or settlement requirements. Respond in ${langName}.`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text;
}

async function generateGeminiMajorAnalysis(userProfile, recommendations) {
  if (!isGeminiConfigured()) {
    return {
      enabled: false,
      analysis: null,
      warning: 'Gemini is not configured yet. Rule-based recommendations are being used.'
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
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const cleanedText = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    return {
      enabled: true,
      analysis: JSON.parse(cleanedText),
      warning: null
    };
  } catch (error) {
    console.error('Gemini major recommendation error:', error.message);
    return {
      enabled: false,
      analysis: null,
      warning: 'Gemini analysis is temporarily unavailable.'
    };
  }
}

async function translateGeminiAnnouncement(imageBase64, mimeType, textContent) {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured');
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
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;

    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
    parts.push({
      text: `${systemPrompt}\n\nPlease translate this announcement image. Explain any dates and required steps.`
    });
  } else {
    parts.push({
      text: `${systemPrompt}\n\nAnnouncement Text:\n${textContent || ''}\n\nPlease translate this text announcement.`
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  const cleanedText = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleanedText);
}

module.exports = {
  isGeminiConfigured,
  generateGeminiChat,
  generateGeminiMajorAnalysis,
  translateGeminiAnnouncement,
};
