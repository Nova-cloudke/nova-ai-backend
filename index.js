
const http = require("http");
const knowledge = require("./knowledge");
const evidence = require("./evidence");
const experiments = require("./experiments");
const storage = require("./storage");
const intelligence = require("./intelligence");

const PORT = Number(process.env.PORT) || 3000;
const VERSION = "2.8.0";

const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const engines = {
  opportunityDiscovery: {
    name: "Opportunity Discovery Engine",
    stages: [
      "Understand the problem",
      "Identify unmet needs",
      "Explore opportunities",
      "Compare solutions",
      "Recommend next actions"
    ]
  },

  novaGenesis: {
    name: "Nova Genesis Engine",
    stages: [
      "Capture an idea",
      "Understand its purpose",
      "Investigate existing knowledge",
      "Identify unanswered questions",
      "Design experiments",
      "Evaluate evidence",
      "Develop possible solutions"
    ]
  }
};

function restoreData() {
  knowledge.loadKnowledge(storage.loadData("knowledge"));
  evidence.loadEvidence(storage.loadData("evidence"));
  experiments.loadExperiments(storage.loadData("experiments"));
}

function persist(name, data) {
  return storage.saveData(name, data);
}

function send(res, status, data) {
  if (res.writableEnded) return;

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", chunk => {
      size += chunk.length;

      if (size > 1_000_000) {
        const error = new Error("Request body is too large.");
        error.statusCode = 413;
        reject(error);
        req.destroy();
        return;
      }

      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        const error = new Error("Invalid JSON body.");
        error.statusCode = 400;
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

async function generateAI(question, mode, context) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      answer: null,
      notice:
        "Groq is not configured. Independent intelligence analysis remains available."
    };
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: GROQ_MODEL,

        messages: [
          {
            role: "system",
            
content: [
  "You are Nova AI inside Nova Cloud.",
  "Answer the user's question directly.",
  "Write answers in numbered point form using exactly this style: 1) 2) 3) 4) 5).",
  "Start every main point on a new line.",
  "Do not use 1. or 1 - or bullet symbols for main points.",
  "Keep each point short, clear, and easy to understand.",
  "Use 3 to 7 points depending on the question.",
  "Avoid long paragraphs, introductions, greetings, and filler.",
  "Use subpoints only when necessary.",
  "Include a practical next action as the final numbered point when useful.",
  "Never invent facts, statistics, sources, or results.",
  "Clearly state important uncertainties.",
  "Return only the answer text, without JSON or model information.",
  `Requested mode: ${mode}`
].join("\n")
          },

          {
            role: "user",
            content: JSON.stringify({
              question,
              mode,
              context
            })
          }
        ],

        temperature: 0.2
      }),

      signal: AbortSignal.timeout(60000)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Groq request failed:",
      response.status,
      data.error?.message || "Unknown API error"
    );

    throw new Error("Groq AI request failed.");
  }

  const rawAnswer = data.choices?.[0]?.message?.content || null;

return {
  configured: true,
  answer: rawAnswer,
  model: data.model || GROQ_MODEL
}
};

async function handle(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });

    return res.end();
  }

  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const method = req.method;

  if (method === "GET" && path === "/") {
    return send(res, 200, {
      success: true,
      name: "Nova AI",
      version: VERSION,
      message: "Nova AI backend is running.",
      health: "/api/health"
    });
  }

  if (method === "GET" && path === "/api/health") {
    return send(res, 200, {
      success: true,
      name: "Nova AI",
      version: VERSION,
      status: "healthy",
      engines: Object.keys(engines),
      independentIntelligence: true,
      aiConfigured: Boolean(process.env.GROQ_API_KEY),
      aiProvider: "Groq",
      aiModel: GROQ_MODEL
    });
  }

  if (method === "POST" && path === "/api/core") {
    const body = await readBody(req);
    const question = String(body.question || "").trim();
    const mode = body.mode || "all";

    if (!question) {
      return send(res, 400, {
        success: false,
        error: "A question is required."
      });
    }

    if (!["all", "opportunity", "genesis"].includes(mode)) {
      return send(res, 400, {
        success: false,
        error: "Mode must be all, opportunity, or genesis."
      });
    }

    const existingData = {
      knowledge: knowledge.searchKnowledge(question),
      evidence: evidence.searchEvidence(question),
      experiments: experiments.searchExperiments(question)
    };

    const independent = intelligence.analyze(
      question,
      mode,
      existingData
    );

    let ai = {
      configured: Boolean(process.env.GROQ_API_KEY),
      answer: null,
      notice: "Independent intelligence analysis completed."
    };

    try {
      ai = await generateAI(question, mode, existingData);
    } catch (error) {
      console.error("AI error:", error.message);

      ai = {
        configured: Boolean(process.env.GROQ_API_KEY),
        answer: null,
        notice:
          "Groq is unavailable. Independent intelligence analysis remains available."
      };
    }

    const answer = ai.answer || 
  "1. AI is temporarily unavailable.\n2. Please try again shortly.";

return send(res, 200, {
  success: true,
  answer
});
  }

  if (path === "/api/knowledge" && method === "GET") {
    const query = url.searchParams.get("q");

    return send(res, 200, {
      success: true,
      records: query
        ? knowledge.searchKnowledge(query)
        : knowledge.getAllKnowledge()
    });
  }

  if (path === "/api/knowledge" && method === "POST") {
    const record = knowledge.addKnowledge(await readBody(req));

    persist("knowledge", knowledge.getAllKnowledge());

    return send(res, 201, {
      success: true,
      record
    });
  }

  if (path === "/api/evidence" && method === "GET") {
    const query = url.searchParams.get("q");

    return send(res, 200, {
      success: true,
      records: query
        ? evidence.searchEvidence(query)
        : evidence.getAllEvidence()
    });
  }

  if (path === "/api/evidence" && method === "POST") {
    const record = evidence.evaluateEvidence(await readBody(req));

    persist("evidence", evidence.getAllEvidence());

    return send(res, 201, {
      success: true,
      record
    });
  }

  if (path === "/api/experiments" && method === "GET") {
    const query = url.searchParams.get("q");

    return send(res, 200, {
      success: true,
      records: query
        ? experiments.searchExperiments(query)
        : experiments.getAllExperiments()
    });
  }

  if (path === "/api/experiments" && method === "POST") {
    const record = experiments.createExperiment(
      await readBody(req)
    );

    persist("experiments", experiments.getAllExperiments());

    return send(res, 201, {
      success: true,
      record
    });
  }

  let match = path.match(/^\/api\/experiments\/(\d+)$/);

  if (match && method === "GET") {
    const record = experiments.getExperiment(match[1]);

    if (!record) {
      return send(res, 404, {
        success: false,
        error: "Experiment not found."
      });
    }

    return send(res, 200, {
      success: true,
      record
    });
  }

  match = path.match(
    /^\/api\/experiments\/(\d+)\/observations$/
  );

  if (match && method === "POST") {
    const body = await readBody(req);

    const record = experiments.addObservation(
      match[1],
      body.observation
    );

    persist("experiments", experiments.getAllExperiments());

    return send(res, 200, {
      success: true,
      record
    });
  }

  match = path.match(
    /^\/api\/experiments\/(\d+)\/complete$/
  );

  if (match && method === "POST") {
    const body = await readBody(req);

    const record = experiments.completeExperiment(
      match[1],
      body.conclusion
    );

    persist("experiments", experiments.getAllExperiments());

    return send(res, 200, {
      success: true,
      record
    });
  }

  return send(res, 404, {
    success: false,
    error: "Endpoint not found."
  });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(error => {
    console.error("Request failed:", error.message);

    if (!res.headersSent) {
      send(res, error.statusCode || 400, {
        success: false,
        error: error.message || "Request failed."
      });
    } else if (!res.writableEnded) {
      res.end();
    }
  });
});

try {
  restoreData();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Nova AI v${VERSION} running on port ${PORT}`);
    console.log(
      `Independent intelligence: ${intelligence.VERSION}`
    );
    console.log(
      `Groq configured: ${Boolean(process.env.GROQ_API_KEY)}`
    );
  });
} catch (error) {
  console.error("Nova AI startup failed:", error.message);
  process.exit(1);
}
