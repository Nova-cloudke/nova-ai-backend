
"use strict";

const http = require("node:http");
const crypto = require("node:crypto");

const intelligence = require("./intelligence.js");
const postgresEngines = require("./postgres-engines.js");
const database = require("./database.js");

const PORT = process.env.PORT || 3000;
const VERSION = "3.1.0";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "openai/gpt-oss-120b";
const NOVA_ADMIN_KEY = process.env.NOVA_ADMIN_KEY || "";

let enginesReady = false;

// RESPONSE

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Nova-Admin-Key"
  });

  res.end(JSON.stringify(data));
}

// REQUEST BODY

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();

      if (body.length > 1000000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

// ADMIN AUTHENTICATION

function authenticateAdmin(req, res) {
  if (!NOVA_ADMIN_KEY) {
    sendJSON(res, 503, {
      success: false,
      error: "Admin access is not configured."
    });

    return false;
  }

  const suppliedKey = req.headers["x-nova-admin-key"];

  if (
    typeof suppliedKey !== "string" ||
    suppliedKey.length !== NOVA_ADMIN_KEY.length ||
    !crypto.timingSafeEqual(
      Buffer.from(suppliedKey),
      Buffer.from(NOVA_ADMIN_KEY)
    )
  ) {
    sendJSON(res, 401, {
      success: false,
      error: "Unauthorized admin access."
    });

    return false;
  }

  return true;
}

// STORED CONTEXT

function getStoredContext() {
  function readSafely(name, getter) {
    try {
      const result = getter();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`${name} storage unavailable:`, error.message);
      return [];
    }
  }

  return {
    knowledge: readSafely(
      "Knowledge",
      () => postgresEngines.getAllKnowledge()
    ),

    evidence: readSafely(
      "Evidence",
      () => postgresEngines.getAllEvidence()
    ),

    experiments: readSafely(
      "Experiments",
      () => postgresEngines.getAllExperiments()
    )
  };
}

// FALLBACK INTELLIGENCE

function createFallbackAnswer(question, analysis) {
  const steps = Array.isArray(
    analysis?.investigationPlan?.steps
  )
    ? analysis.investigationPlan.steps
    : [];

  const points = [
    `Question: ${question}`,
    "Investigation approach:"
  ];

  steps.forEach((step, index) => {
    points.push(`${index + 1}) ${step}`);
  });

  if (analysis?.knowledgeGaps?.length) {
    points.push(
      `Information gaps: ${analysis.knowledgeGaps.join(" ")}`
    );
  }

  points.push(
    "Next action: Gather relevant evidence and test the most important assumption."
  );

  return points.join("\n");
}

// GROQ INTELLIGENCE

async function askGroq(question, analysis) {
  const systemPrompt = [
    "You are Nova AI, the intelligence engine for Nova Cloud.",
    "Answer the user's actual question directly.",
    "Use simple, clear and practical language.",
    "Keep the entire answer under 250 words.",
    "Use numbered points in this exact style: 1) 2) 3).",
    "Follow the number of points explicitly requested by the user.",
    "If no number is requested, provide 3 to 5 useful points.",
    "Each point must contain meaningful information.",
    "Avoid repeated ideas and unnecessary introductions.",
    "Separate established facts, assumptions and unknowns.",
    "Never invent statistics, sources or research findings.",
    "Do not present hypotheses as verified evidence.",
    "Do not claim to have performed live internet research.",
    "Use stored knowledge, evidence and experiments where relevant.",
    "Treat stored records according to their evidence status.",
    "End with one specific practical next action."
  ].join(" ");

  const context = JSON.stringify({
    investigation: analysis,
    instruction:
      "Use this structured analysis as context. Do not treat plans, assumptions or hypotheses as verified evidence."
  });

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content:
              `Question: ${question}\n\n` +
              `Investigation context:\n${context}`
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Groq request failed (HTTP ${response.status}): ` +
      errorText.slice(0, 500)
    );
  }

  const result = await response.json();
  const answer = result?.choices?.[0]?.message?.content;

  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("Groq returned no readable answer.");
  }

  return answer.trim();
}

// CORE INTELLIGENCE ENDPOINT

async function handleCore(req, res) {
  let body;

  try {
    body = await readBody(req);
  } catch (error) {
    return sendJSON(res, 400, {
      success: false,
      error: error.message
    });
  }

  const question =
    typeof body.question === "string"
      ? body.question.trim()
      : "";

  if (!question) {
    return sendJSON(res, 400, {
      success: false,
      error: "A question is required."
    });
  }

  if (question.length > 12000) {
    return sendJSON(res, 413, {
      success: false,
      error: "Question is too long."
    });
  }

  const modeMap = {
    all: "all",
    opportunity: "opportunityDiscovery",
    opportunityDiscovery: "opportunityDiscovery",
    genesis: "novaGenesis",
    novaGenesis: "novaGenesis"
  };

  const mode = modeMap[body.mode || "all"];

  if (!mode) {
    return sendJSON(res, 400, {
      success: false,
      error: "Unsupported mode."
    });
  }

  let analysis;

  try {
    analysis = intelligence.analyze(
      question,
      mode,
      getStoredContext()
    );
  } catch (error) {
    console.error("Independent intelligence error:", error.message);

    return sendJSON(res, 500, {
      success: false,
      error: "Independent intelligence analysis failed."
    });
  }

  let answer;
  let aiProvider = "independent";

  if (GROQ_API_KEY) {
    try {
      answer = await askGroq(question, analysis);
      aiProvider = "Groq";
    } catch (error) {
      console.error("Groq unavailable:", error.message);
      answer = createFallbackAnswer(question, analysis);
    }
  } else {
    answer = createFallbackAnswer(question, analysis);
  }

  return sendJSON(res, 200, {
    success: true,
    answer,
    analysis,
    version: VERSION,
    aiProvider,
    independentIntelligence: true,
    storedData: {
      knowledge: analysis.existingData.knowledge.length,
      evidence: analysis.existingData.evidence.length,
      experiments: analysis.existingData.experiments.length
    }
  });
}

// ADMIN DATA ENDPOINTS

async function handleAdminData(req, res, category) {
  if (!authenticateAdmin(req, res)) {
    return;
  }

  if (!enginesReady) {
    return sendJSON(res, 503, {
      success: false,
      error: "Storage engines are not ready."
    });
  }

  const getters = {
    knowledge: postgresEngines.getAllKnowledge,
    evidence: postgresEngines.getAllEvidence,
    experiments: postgresEngines.getAllExperiments
  };

  if (req.method === "GET") {
    try {
      const records = getters[category]();

      return sendJSON(res, 200, {
        success: true,
        category,
        count: records.length,
        records
      });
    } catch (error) {
      console.error("Data retrieval error:", error.message);

      return sendJSON(res, 500, {
        success: false,
        error: "Could not retrieve stored records."
      });
    }
  }

  if (req.method === "POST") {
    let body;

    try {
      body = await readBody(req);
    } catch (error) {
      return sendJSON(res, 400, {
        success: false,
        error: error.message
      });
    }

    try {
      let record;

      if (category === "knowledge") {
        record = await postgresEngines.addKnowledge(body);
      }

      if (category === "evidence") {
        record = await postgresEngines.evaluateEvidence(body);
      }

      if (category === "experiments") {
        record = await postgresEngines.createExperiment(body);
      }

      return sendJSON(res, 201, {
        success: true,
        category,
        message: "Record saved successfully.",
        record
      });

    } catch (error) {
      console.error("Data save error:", error.message);

      return sendJSON(res, 400, {
        success: false,
        error: error.message
      });
    }
  }

  return sendJSON(res, 405, {
    success: false,
    error: "Method not allowed."
  });
}

// HTTP SERVER

const server = http.createServer(async (req, res) => {
  let pathname;

  try {
    pathname = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    ).pathname;
  } catch {
    return sendJSON(res, 400, {
      success: false,
      error: "Invalid request URL."
    });
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Nova-Admin-Key"
    });

    return res.end();
  }

  // ROOT

  if (req.method === "GET" && pathname === "/") {
    return sendJSON(res, 200, {
      success: true,
      name: "Nova AI",
      version: VERSION,
      status: "running",
      health: "/api/health"
    });
  }

  // HEALTH

  if (req.method === "GET" && pathname === "/api/health") {
    let storageInfo;

    try {
      storageInfo = await database.getStorageInfo();
    } catch (error) {
      storageInfo = {
        success: false,
        persistent: false,
        status: "unavailable"
      };
    }

    const context = getStoredContext();

    return sendJSON(res, 200, {
      success: true,
      name: "Nova AI",
      version: VERSION,
      status:
        storageInfo.success && enginesReady
          ? "healthy"
          : "degraded",
      engines: [
        "knowledge",
        "evidence",
        "experiments",
        "intelligence",
        "opportunityDiscovery",
        "novaGenesis"
      ],
      enginesReady,
      storedData: {
        knowledge: context.knowledge.length,
        evidence: context.evidence.length,
        experiments: context.experiments.length
      },
      storage: storageInfo,
      independentIntelligence: true,
      aiConfigured: Boolean(GROQ_API_KEY),
      aiProvider: GROQ_API_KEY ? "Groq" : "independent",
      aiModel: GROQ_API_KEY ? GROQ_MODEL : null,
      adminConfigured: Boolean(NOVA_ADMIN_KEY)
    });
  }

  // CORE

  if (req.method === "POST" && pathname === "/api/core") {
    try {
      return await handleCore(req, res);
    } catch (error) {
      console.error("Core request failed:", error.message);

      return sendJSON(res, 500, {
        success: false,
        error: "Nova AI encountered an internal error."
      });
    }
  }

  // KNOWLEDGE, EVIDENCE AND EXPERIMENTS

  const adminMatch = pathname.match(
    /^\/api\/admin\/(knowledge|evidence|experiments)$/
  );

  if (adminMatch) {
    if (!["GET", "POST"].includes(req.method)) {
      return sendJSON(res, 405, {
        success: false,
        error: "Method not allowed."
      });
    }

    try {
      return await handleAdminData(
        req,
        res,
        adminMatch[1]
      );
    } catch (error) {
      console.error("Admin endpoint error:", error.message);

      return sendJSON(res, 500, {
        success: false,
        error: "Admin operation failed."
      });
    }
  }

  return sendJSON(res, 404, {
    success: false,
    error: "Endpoint not found."
  });
});

// DATABASE INITIALIZATION

async function initializeDatabaseEngines() {
  try {
    const result = await postgresEngines.initializeEngines();

    if (result === false) {
      enginesReady = false;

      console.warn(
        "Nova AI: PostgreSQL engines unavailable."
      );

      return;
    }

    enginesReady = true;

    console.log(
      "Nova AI PostgreSQL engines initialized successfully."
    );

  } catch (error) {
    enginesReady = false;

    console.error(
      "Nova AI database initialization failed:",
      error.message
    );
  }
}

// START SERVER

server.on("error", error => {
  console.error("Nova AI server error:", error);
  process.exitCode = 1;
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Nova AI ${VERSION} running on port ${PORT}.`
  );

  initializeDatabaseEngines();
});
             
