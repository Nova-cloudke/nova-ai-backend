
const http = require("http");

const knowledge = require("./knowledge");
const evidence = require("./evidence");
const experiments = require("./experiments");

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
      "Capture a question",
      "Investigate knowledge",
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
  let selectedEngines = engines;

  if (mode === "opportunity") {
    selectedEngines = {
      opportunityDiscovery: engines.opportunityDiscovery
    };
  }

  if (mode === "genesis") {
    selectedEngines = {
      novaGenesis: engines.novaGenesis
    };
  }

  return {
    success: true,
    name: "Nova AI",
    version: "2.3.0",
    question,
    mode,
    engines: selectedEngines,
    knowledge: {
      matches: knowledge.searchKnowledge(question),
      totalStored: knowledge.getAllKnowledge().length
    },
    evidence: {
      matches: evidence.searchEvidence(question),
      totalStored: evidence.getAllEvidence().length
    },
    experiments: {
      matches: experiments.searchExperiments(question),
      totalStored: experiments.getAllExperiments().length
    },
    nextSteps: [
      "Understand the question",
      "Review relevant knowledge",
      "Identify missing evidence",
      "Plan an experiment where appropriate",
      "Evaluate results and recommend next actions"
    ],
    note: "Structured intelligence backend. An AI model is not connected yet."
  };
}

const server = http.createServer((req, res) => {
  const path = req.url.split("?")[0];

  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, { success: true });
  }

  if (req.method === "GET" && path === "/api/health") {
    return sendJSON(res, 200, {
      success: true,
      name: "Nova AI",
      version: "2.3.0",
      status: "healthy"
    });
  }

  if (req.method === "POST" && path === "/api/core") {
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

      return sendJSON(res, 200, analyze(question, mode));
    });
  }

  if (req.method === "GET" && path === "/api/knowledge") {
    return sendJSON(res, 200, {
      success: true,
      knowledge: knowledge.getAllKnowledge()
    });
  }

  if (req.method === "POST" && path === "/api/knowledge") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const entry = knowledge.addKnowledge(data);
        return sendJSON(res, 201, { success: true, entry });
      } catch (err) {
        return sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  if (path === "/api/evidence" && req.method === "GET") {
    return sendJSON(res, 200, {
      success: true,
      evidence: evidence.getAllEvidence()
    });
  }

  if (path === "/api/evidence" && req.method === "POST") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const record = evidence.evaluateEvidence(data);
        return sendJSON(res, 201, {
          success: true,
          record,
          note: "The supplied status has not been independently verified."
        });
      } catch (err) {
        return sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  if (path === "/api/experiments" && req.method === "GET") {
    return sendJSON(res, 200, {
      success: true,
      experiments: experiments.getAllExperiments()
    });
  }

  if (path === "/api/experiments" && req.method === "POST") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const experiment = experiments.createExperiment(data);
        return sendJSON(res, 201, {
          success: true,
          experiment
        });
      } catch (err) {
        return sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  const observationMatch = path.match(
    /^\/api\/experiments\/(\d+)\/observations$/
  );

  if (req.method === "POST" && observationMatch) {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const experiment = experiments.addObservation(
          observationMatch[1],
          data.observation
        );
        return sendJSON(res, 200, { success: true, experiment });
      } catch (err) {
        return sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  const completeMatch = path.match(
    /^\/api\/experiments\/(\d+)\/complete$/
  );

  if (req.method === "POST" && completeMatch) {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const experiment = experiments.completeExperiment(
          completeMatch[1],
          data.conclusion
        );
        return sendJSON(res, 200, { success: true, experiment });
      } catch (err) {
        return sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  const experimentMatch = path.match(
    /^\/api\/experiments\/(\d+)$/
  );

  if (req.method === "GET" && experimentMatch) {
    const experiment = experiments.getExperiment(experimentMatch[1]);

    if (!experiment) {
      return sendJSON(res, 404, {
        success: false,
        error: "Experiment not found."
      });
    }

    return sendJSON(res, 200, {
      success: true,
      experiment
    });
  }

  return sendJSON(res, 404, {
    success: false,
    error: "Endpoint not found."
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Nova AI V2 running on port ${PORT}`);
});

module.exports = { server, analyze, engines };
