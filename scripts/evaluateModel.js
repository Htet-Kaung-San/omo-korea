require("dotenv").config({ path: "../.env" });
const ragService = require("../services/ragService");
const { isDigitalOceanConfigured, generateDigitalOceanChat } = require("../services/digitalOceanService");
const { isOpenRouterConfigured, generateOpenRouterChat } = require("../services/openrouterService");
const { isGeminiConfigured, generateGeminiChat } = require("../services/geminiService");

const benchmarkQuestions = [
  {
    question: "How do I get my Alien Registration Card (ARC)?",
    expectedKeywords: ["90 days", "immigration", "passport", "30,000", "hikorea"],
  },
  {
    question: "Where is the Central Library located?",
    expectedKeywords: ["library", "map"],
  },
  {
    question: "What is the requirement for graduation regarding Korean language?",
    expectedKeywords: ["topik", "level 4"],
  },
  {
    question: "Where can I eat lunch on campus?",
    expectedKeywords: ["cafeteria", "geumjeong", "moonchang"],
  },
  {
    question: "What courses should I take next semester as a freshman?",
    expectedKeywords: ["course", "major"],
  }
];

async function generateAnswer(question) {
  let context = "";
  try {
    context = await ragService.retrieveContext(question, { country: "ALL", gender: "ALL" }, 3);
  } catch (err) {
    console.warn("RAG retrieval failed:", err.message);
  }

  let prompt = `PNU Knowledge Base Context:\n${context}\n\nUser Question: ${question}`;
  let reply = "";

  if (isDigitalOceanConfigured()) {
    reply = await generateDigitalOceanChat(prompt, []);
  } else if (isOpenRouterConfigured()) {
    reply = await generateOpenRouterChat(prompt, []);
  } else if (isGeminiConfigured()) {
    reply = await generateGeminiChat(prompt, "EN", context);
  } else {
    reply = "Model not configured.";
  }
  
  return reply;
}

function evaluateAnswer(answer, expectedKeywords) {
  const lowerAnswer = answer.toLowerCase();
  let matches = 0;
  for (const keyword of expectedKeywords) {
    if (lowerAnswer.includes(keyword.toLowerCase())) {
      matches++;
    }
  }
  return {
    matches,
    total: expectedKeywords.length,
    passed: matches > 0, // Pass if at least one keyword is hit
    score: (matches / expectedKeywords.length) * 100
  };
}

async function runEvaluation() {
  console.log("========================================");
  console.log("🚀 Starting AI Model Evaluation Suite...");
  console.log("========================================\n");

  let totalQuestions = benchmarkQuestions.length;
  let passedQuestions = 0;
  let totalScore = 0;

  for (let i = 0; i < benchmarkQuestions.length; i++) {
    const q = benchmarkQuestions[i];
    console.log(`[Test ${i + 1}/${totalQuestions}]`);
    console.log(`Q: ${q.question}`);
    console.log(`Expected Keywords: ${q.expectedKeywords.join(", ")}`);
    
    process.stdout.write("Generating answer... ");
    const startTime = Date.now();
    const answer = await generateAnswer(q.question);
    const duration = Date.now() - startTime;
    console.log(`Done (${duration}ms)`);
    
    const evaluation = evaluateAnswer(answer, q.expectedKeywords);
    totalScore += evaluation.score;
    if (evaluation.passed) passedQuestions++;

    console.log(`Status: ${evaluation.passed ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Score: ${evaluation.score.toFixed(0)}% (${evaluation.matches}/${evaluation.total} keywords hit)`);
    console.log(`A: ${answer.substring(0, 150).replace(/\n/g, ' ')}...`);
    console.log("----------------------------------------\n");
  }

  const accuracy = (passedQuestions / totalQuestions) * 100;
  const avgScore = totalScore / totalQuestions;

  console.log("========================================");
  console.log("📊 Evaluation Summary:");
  console.log(`Total Tests: ${totalQuestions}`);
  console.log(`Passed:      ${passedQuestions}`);
  console.log(`Failed:      ${totalQuestions - passedQuestions}`);
  console.log(`Pass Rate:   ${accuracy.toFixed(1)}%`);
  console.log(`Avg Keyword Hit Rate: ${avgScore.toFixed(1)}%`);
  console.log("========================================");
  process.exit(0);
}

runEvaluation().catch(err => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
