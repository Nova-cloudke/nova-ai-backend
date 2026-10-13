
const http = require("http");

const {
  addKnowledge,
  searchKnowledge,
  getAllKnowledge
} = require("./knowledge");

const {
  evaluateEvidence,
  searchEvidence,
  getAllEvidence
} = require("./evidence");

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

function readBody(req, callback) {
  let body = "";

  req.on("data", chunk => {
    body += chunk;
    if (body.length > 100000) {
      req.destroy();
    }
  });

  req.on("end", () => {
    try {
      callback(null, JSON.parse(body || "{}"));
    } catch {
      callback(new Error("Invalid JSON request."));
    }
  });

  req.on("error", error => callback(error));
}

function analyze(question, mode = "all") {
  const selectedEngines =
    mode === "opportunity"
      ? { opportunityDiscovery: engines.opportunityDiscovery }
      : mode === "genesis"
        ? { novaGenesis: engines.novaGenesis }
        : engines;

  return {
    success: true,
    name: "Nova AI",
    version: "2.2.0",
    question,
    mode,
    engines: selectedEngines,
    knowledge: {
      matches: searchKnowledge(question),
      totalStored: getAllKnowledge().length
    },
    evidence: {
      matches: searchEvidence(question),
      totalStored: getAllEvidence().length
    },
    nextSteps: [
      "Understand the question",
      "Review relevant knowledge",
      "Identify missing evidence",
      "Compare possible solutions",
      "Recommend a practical next action"
    ],
    note: "Structured intelligence backend. A real AI model is not connected yet."
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, { success: true });
  }

  if (req.method === "GET" && req.url === "/api/health") {
    return sendJSON(res, 200, {
      success: true,
      name: "Nova AI",
      version: "2.2.0",
      status: "healthy"
    });
  }

  if (req.method === "GET" && req.url === "/api/knowledge") {
    return sendJSON(res, 200, {
      success: true,
      knowledge: getAllKnowledge()
    });
  }

  if (req.method === "POST" && req.url === "/api/knowledge") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const entry = addKnowledge(data);
        sendJSON(res, 201, { success: true, entry });
      } catch (err) {
        sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  if (req.method === "GET" && req.url === "/api/evidence") {
    return sendJSON(res, 200, {
      success: true,
      evidence: getAllEvidence()
    });
  }

  if (req.method === "POST" && req.url === "/api/evidence") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const record = evaluateEvidence(data);
        sendJSON(res, 201, {
          success: true,
          record,
          note: "Status is user-supplied and has not been independently verified."
        });
      } catch (err) {
        sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  if (req.method === "POST" && req.url === "/api/core") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

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
    });
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
