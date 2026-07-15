function createQueryChain() {
  const base = {
    select: jest.fn(() => base),
    eq: jest.fn(() => base),
    order: jest.fn(() => base),
    limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
  };

  return base;
}

const mockSupabase = {
  from: jest.fn(() => createQueryChain()),
};

jest.mock("../supabaseClient", () => mockSupabase);

jest.mock("../services/ragService", () => ({
  retrieveContext: jest.fn(),
}));

jest.mock("../services/openrouterService", () => ({
  isOpenRouterConfigured: jest.fn(),
  generateOpenRouterChat: jest.fn(),
  generateOpenRouterChatStream: jest.fn(),
  generateOpenRouterMajorAnalysis: jest.fn(),
}));

jest.mock("../services/geminiService", () => ({
  isGeminiConfigured: jest.fn(),
  generateGeminiChat: jest.fn(),
  generateGeminiChatStream: jest.fn(),
  generateGeminiMajorAnalysis: jest.fn(),
  translateGeminiAnnouncement: jest.fn(),
}));

const ragService = require("../services/ragService");
const openrouterService = require("../services/openrouterService");
const geminiService = require("../services/geminiService");
const aiController = require("../controllers/aiController");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("AI chat controller behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "";
    process.env.CLAUDE_MODEL = "";
    ragService.retrieveContext.mockResolvedValue("");
  });

  it("uses an available provider when OpenRouter is configured", async () => {
    openrouterService.isOpenRouterConfigured.mockReturnValue(true);
    geminiService.isGeminiConfigured.mockReturnValue(false);
    openrouterService.generateOpenRouterChat.mockResolvedValue("OpenRouter answer");

    const req = { body: { message: "Hello there" } };
    const res = createRes();

    await aiController.handleChat(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBe("OpenRouter answer");
    expect(res.body.metadata.provider).toBe("openrouter");
    expect(res.body.metadata.isFallback).toBe(false);
  });

  it("falls back with clear metadata when no provider is configured", async () => {
    openrouterService.isOpenRouterConfigured.mockReturnValue(false);
    geminiService.isGeminiConfigured.mockReturnValue(false);

    const req = { body: { message: "Where is the library?" } };
    const res = createRes();

    await aiController.handleChat(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.metadata.provider).toBe("fallback");
    expect(res.body.metadata.isFallback).toBe(true);
    expect(res.body.metadata.fallbackReason).toBeDefined();
  });

  it("includes RAG context when retrieval succeeds", async () => {
    openrouterService.isOpenRouterConfigured.mockReturnValue(true);
    geminiService.isGeminiConfigured.mockReturnValue(false);
    ragService.retrieveContext.mockResolvedValue("Verified campus guide");
    openrouterService.generateOpenRouterChat.mockResolvedValue("OpenRouter answer");

    const req = { body: { message: "Tell me about the library" } };
    const res = createRes();

    await aiController.handleChat(req, res);

    expect(ragService.retrieveContext).toHaveBeenCalled();
    expect(openrouterService.generateOpenRouterChat.mock.calls[0][0]).toContain("PNU Knowledge Base Context");
    expect(res.body.metadata.ragUsed).toBe(true);
    expect(res.body.metadata.ragStatus).toBe("used");
  });

  it("degrades gracefully when RAG retrieval fails but provider still answers", async () => {
    openrouterService.isOpenRouterConfigured.mockReturnValue(true);
    geminiService.isGeminiConfigured.mockReturnValue(false);
    ragService.retrieveContext.mockRejectedValue(new Error("vector lookup failed"));
    openrouterService.generateOpenRouterChat.mockResolvedValue("OpenRouter answer");

    const req = { body: { message: "Tell me about visa" } };
    const res = createRes();

    await aiController.handleChat(req, res);

    expect(res.body.reply).toBe("OpenRouter answer");
    expect(res.body.metadata.provider).toBe("openrouter");
    expect(res.body.metadata.ragUsed).toBe(false);
    expect(res.body.metadata.ragStatus).toBe("failed");
  });
});
