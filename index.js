
const http = require("http");
const {
  addKnowledge,
  searchKnowledge,
  getAllKnowledge
} = require("./knowledge");

const PORT = Number(process.env.PORT) || 3000;

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
      "Identify knowledge gaps",
      "Design experiments",
      "Evaluate evidence",
      "Develop potential solutions"
    ]
  }
};

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(JSON.stringify(data, null, 2));
}

function analyze(question, mode = "all") {
  const knowledge = searchKnowledge(question);

  const selectedEngines =
    mode === "opportunity"
      ? { opportunityDiscovery: engines.opportunityDiscovery }
      : mode === "genesis"
        ? { novaGenesis: engines.novaGenesis }
        : engines;

  return {
    success: true,
    name: "Nova AI",
    version: "2.1.0",
    question,
    mode,
    engines: selectedEngines,
    knowledge: {
      matches: knowledge,
      totalStored: getAllKnowledge().length
    },
    guidance: [
      "Understand the question clearly.",
      "Investigate existing information.",
      "Identify missing evidence.",
      "Compare possible solutions.",
      "Recommend a practical next action."
    ],
    note: "This version uses structured logic and stored knowledge. An AI model is not connected yet."
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, { success: true });
  }

  if (req.url === "/api/health" && req.method === "GET") {
    return sendJSON(res, 200, {
      success: true,
      name: "Nova AI",
      version: "2.1.0",
      status: "healthy"
    });
  }

  if (req.url === "/api/knowledge" && req.method === "GET") {
    return sendJSON(res, 200, {
      success: true,
      knowledge: getAllKnowledge()
    });
  }

  if (req.url === "/api/knowledge" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 100000) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const entry = addKnowledge({
          topic: data.topic,
          content: data.content,
          source: data.source || "User-provided",
          confidence: data.confidence || "unverified",
          tags: Array.isArray(data.tags) ? data.tags : []
        });

        sendJSON(res, 201, {
          success: true,
          message: "Knowledge added",
          entry
        });
      } catch (error) {
        sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }
    });

    return;
  }

  if (req.url === "/api/core" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 100000) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const question = String(data.question || "").trim();
        const mode = data.mode || "all";

        if (!question) {
          return sendJSON(res, 400, {
            success: false,
            error: "A question is required."
          });
        }

        if (!["all", "opportunity", "genesis"].includes(mode)) {
          return sendJSON(res, 400, {
            success: false,
            error: "Mode must be all, opportunity, or genesis."
          });
        }

        sendJSON(res, 200, analyze(question, mode));
      } catch (error) {
        sendJSON(res, 400, {
          success: false,
          error: "Invalid JSON request."
        });
      }
    });

    return;
  }

  sendJSON(res, 404, {
    success: false,
    error: "Endpoint not found."
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Nova AI V2 running on port ${PORT}`);
});

module.exports = { server, analyze, engines };
                  
