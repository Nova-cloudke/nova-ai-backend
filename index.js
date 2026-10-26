"use strict";

const http = require("node:http");
const intelligence = require("./intelligence.js");

const PORT = process.env.PORT || 3000;
const VERSION = "2.8.1";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "openai/gpt-oss-120b";

function sendJSON(res, status, data) {
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

function createFallbackAnswer(question, analysis) {
  const plan = analysis?.investigationPlan;
  const steps = Array.isArray(plan?.steps) ? plan.steps : [];

  const points = [
    `Question: ${question}`,
    "Investigation approach:"
  ];

  steps.forEach((step, index) => {
    points.push(`${index + 1}. ${step}`);
  });

  if (Array.isArray(analysis?.knowledgeGaps)) {
    points.push(
      `${points.length - 1}. Information gaps: ${analysis.knowledgeGaps.join(" ")}`
    );
  }

  points.push(
    "Next action: Gather relevant evidence and test the most important assumption before making a decision."
  );

  return points.join("\n");
}

async function askGroq(question, analysis) {
  const systemPrompt = [
"You are Nova AI, the intelligence engine for Nova Cloud.",
"Answer the user's actual question directly.",
"Use simple, clear, practical language.",
"Keep the entire answer under 250 words.",
"Use numbered points in this exact style: 1) 2) 3).",
"Give a maximum of 5 numbered points.",
"Each point must contain a meaningful finding, explanation, or practical recommendation.",
"Avoid long paragraphs, repeated ideas, introductions, and unnecessary headings.",
"Separate established facts, assumptions, and unknowns when relevant.",
"Never invent statistics, sources, research findings, or evidence.",
"Do not present investigation plans or hypotheses as verified findings.",
"Do not claim to have performed live internet research.",
"End with one specific, practical next action.",
"If information is missing, state what needs to be verified.",
"Never return empty headings, decorative formatting, or meaningless numbered points."
].join(" ");
  const context = JSON.stringify({
    investigation: analysis,
    instruction:
      "Use this structured analysis as context. Do not treat its plans or hypotheses as verified evidence."
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

  const requestedMode = body.mode || "all";

  const modeMap = {
    all: "all",
    opportunity: "opportunityDiscovery",
    opportunityDiscovery: "opportunityDiscovery",
    genesis: "novaGenesis",
    novaGenesis: "novaGenesis"
  };

  const mode = modeMap[requestedMode];

  if (!mode) {
    return sendJSON(res, 400, {
      success: false,
      error: "Unsupported mode."
    });
  }

  let analysis;

  try {
    analysis = intelligence.analyze(question, mode, {
      knowledge: [],
      evidence: [],
      experiments: []
    });
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
    independentIntelligence: true
  });
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  ).pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });

    return res.end();
  }

  if (req.method === "GET" && pathname === "/") {
    return sendJSON(res, 200, {
      success: true,
      name: "Nova AI",
      version: VERSION,
      status: "running",
      health: "/api/health"
    });
  }

  if (req.method === "GET" && pathname === "/api/health") {
    return sendJSON(res, 200, {
      success: true,
      name: "Nova AI",
      version: VERSION,
      status: "healthy",
      engines: [
        "opportunityDiscovery",
        "novaGenesis"
      ],
      independentIntelligence: true,
      aiConfigured: Boolean(GROQ_API_KEY),
      aiProvider: GROQ_API_KEY ? "Groq" : "independent",
      aiModel: GROQ_API_KEY ? GROQ_MODEL : null
    });
  }

  if (req.method === "POST" && pathname === "/api/core") {
    try {
      return await handleCore(req, res);
    } catch (error) {
      console.error("Core request failed:", error);

      if (!res.headersSent) {
        return sendJSON(res, 500, {
          success: false,
          error: "Nova AI encountered an internal error."
        });
      }

      return res.end();
    }
  }

  return sendJSON(res, 404, {
    success: false,
    error: "Endpoint not found."
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Nova AI ${VERSION} running on port ${PORT}`);
});
