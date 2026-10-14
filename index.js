
const http = require("http");

const knowledge = require("./knowledge");
const evidence = require("./evidence");
const experiments = require("./experiments");
const storage = require("./storage");

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

function persist(name, getter) {
  return storage.saveData(name, getter());
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
    version: "2.4.0",
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
    note: "Structured intelligence backend. A real AI model is not connected yet."
  };
}

const server = http.createServer((req, res) => {
  const route = req.url.split("?")[0];

  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, { success: true });
  }

  if (req.method === "GET" && route === "/api/health") {
    return sendJSON(res, 200, {
      success: true,
      name: "Nova AI",
      version: "2.4.0",
      status: "healthy",
      storage: "file-based"
    });
  }

  if (req.method === "GET" && route === "/api/knowledge") {
    return sendJSON(res, 200, {
      success: true,
      knowledge: knowledge.getAllKnowledge()
    });
  }

  if (req.method === "POST" && route === "/api/knowledge") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const entry = knowledge.addKnowledge(data);
        persist("knowledge", knowledge.getAllKnowledge());
        return sendJSON(res, 201, { success: true, entry });
      } catch (err) {
        return sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  if (req.method === "GET" && route === "/api/evidence") {
    return sendJSON(res, 200, {
      success: true,
      evidence: evidence.getAllEvidence()
    });
  }

  if (req.method === "POST" && route === "/api/evidence") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const record = evidence.evaluateEvidence(data);
        persist("evidence", evidence.getAllEvidence());
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

  if (req.method === "GET" && route === "/api/experiments") {
    return sendJSON(res, 200, {
      success: true,
      experiments: experiments.getAllExperiments()
    });
  }

  if (req.method === "POST" && route === "/api/experiments") {
    return readBody(req, (error, data) => {
      if (error) {
        return sendJSON(res, 400, {
          success: false,
          error: error.message
        });
      }

      try {
        const experiment = experiments.createExperiment(data);
        persist("experiments", experiments.getAllExperiments());
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

  const observationMatch = route.match(
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
        persist("experiments", experiments.getAllExperiments());
        return sendJSON(res, 200, { success: true, experiment });
      } catch (err) {
        return sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  const completeMatch = route.match(
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
        persist("experiments", experiments.getAllExperiments());
        return sendJSON(res, 200, { success: true, experiment });
      } catch (err) {
        return sendJSON(res, 400, {
          success: false,
          error: err.message
        });
      }
    });
  }

  const experimentMatch = route.match(
    /^\/api\/experiments\/(\d+)$/
  );

  if (req.method === "GET" && experimentMatch) {
    const experiment = experiments.getExperiment(
      experimentMatch[1]
    );

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
  
