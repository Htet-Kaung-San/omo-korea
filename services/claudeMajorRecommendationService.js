const Anthropic = require('@anthropic-ai/sdk');

function isClaudeConfigured() {
  return Boolean(
    process.env.ANTHROPIC_API_KEY && process.env.CLAUDE_MODEL
  );
}

function extractText(message) {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

function parseJsonResponse(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

async function createClaudeMajorAnalysis(userProfile, recommendations) {
  if (!isClaudeConfigured()) {
    return {
      enabled: false,
      analysis: null,
      warning:
        'Claude is not configured yet. Rule-based recommendations are being used.',
    };
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 800,
      system: `
You are the major recommendation assistant for Hey! PNU, a support platform
for international students at Pusan National University.

Use only the supplied questionnaire data and rule-based recommendations.
Do not guarantee admission, scholarship eligibility, or graduation outcomes.
Treat the eligibility notes as reminders, not final admission decisions.

Return valid JSON only:
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
      `.trim(),
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            userProfile,
            ruleBasedRecommendations: recommendations,
          }),
        },
      ],
    });

    return {
      enabled: true,
      analysis: parseJsonResponse(extractText(message)),
      warning: null,
    };
  } catch (error) {
    console.error('Claude major recommendation error:', error.message);

    return {
      enabled: false,
      analysis: null,
      warning: 'Claude analysis is temporarily unavailable.',
    };
  }
}

module.exports = {
  isClaudeConfigured,
  createClaudeMajorAnalysis,
};