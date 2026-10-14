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
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }

      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

function analyze(question, mode = "all") {
  if (!question || !String(question).trim()) {
    throw new Error("A question is required.");
  }

  const text = String(question).trim();

  const result = {
    question: text,
    mode,
    version: "2.5.0",
    notice: "Structured analysis only. No AI model is connected yet."
  };

  if (mode === "all" || mode === "opportunity") {
    result.opportunityDiscovery = {
      engine: engines.opportunityDiscovery.name,
      stages: engines.opportunityDiscovery.stages,
      nextStep: "Identify the people affected and their unmet needs."
    };
  }

  if (mode === "all" || mode === "genesis") {
    result.novaGenesis = {
      engine: engines.novaGenesis.name,
      stages: engines.novaGenesis.stages,
      nextStep: "Review existing knowledge and identify what remains unknown."
    };
  }

  result.relatedKnowledge = knowledge.searchKnowledge(text);
  result.relatedEvidence = evidence.searchEvidence(text);
  result.relatedExperiments = experiments.searchExperiments(text);

  return result;
}

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
      name: "Nova AI",
      message: "Nova AI backend is running.",
      health: "/api/health"
    });
  }

  if (method === "GET" && path === "/api/health") {
    return send(res, 200, {
      success: true,
      name: "Nova AI",
      version: "2.5.0",
      status: "healthy",
      engines: Object.keys(engines)
    });
  }

  if (method === "POST" && path === "/api/core") {
    const body = await readBody(req);
    const result = analyze(body.question, body.mode || "all");
    return send(res, 200, { success: true, result });
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
    const body = await readBody(req);
    const record = knowledge.addKnowledge(body);
    persist("knowledge", knowledge.getAllKnowledge());
    return send(res, 201, { success: true, record });
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
    const body = await readBody(req);
    const record = evidence.evaluateEvidence(body);
    persist("evidence", evidence.getAllEvidence());
    return send(res, 201, { success: true, record });
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
    const body = await readBody(req);
    const record = experiments.createExperiment(body);
    persist("experiments", experiments.getAllExperiments());
    return send(res, 201, { success: true, record });
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
    return send(res, 200, { success: true, record });
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
    return send(res, 200, { success: true, record });
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
    return send(res, 200, { success: true, record });
  }

  return send(res, 404, {
    success: false,
    error: "Endpoint not found."
  });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(error => {
    const status = error.message === "Invalid JSON body." ||
      error.message === "Request body is too large."
      ? 400
      : 400;

    send(res, status, {
      success: false,
      error: error.message || "Request failed."
    });
  });
});

try {
  restoreData();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Nova AI v2.5.0 running on port ${PORT}`);
  });
} catch (error) {
  console.error("Nova AI startup failed:", error.message);
  process.exit(1);
}
