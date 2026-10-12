
const http = require("http");

const PORT = process.env.PORT || 3000;
const memory = [];

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 100000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

// MODULE 1: NOVA OPPORTUNITY DISCOVERY
function discoverOpportunity(question) {
  return {
    module: "Nova Opportunity Discovery",
    question,
    investigationAreas: [
      "Who experiences this issue?",
      "What needs remain unmet?",
      "What solutions already exist?",
      "Where might gaps or inefficiencies exist?",
      "What value could a new solution create?"
    ],
    nextActions: [
      "Identify potential users",
      "Gather evidence",
      "Compare existing alternatives",
      "Test the most promising opportunity"
    ],
    evidenceStatus: "Not yet independently verified"
  };
}

// MODULE 2: NOVA GENESIS
function investigateGenesis(question) {
  return {
    module: "Nova Genesis",
    question,
    stages: [
      "Define the question",
      "Review existing knowledge",
      "Identify unknowns",
      "Develop testable hypotheses",
      "Design safe experiments",
      "Evaluate evidence",
      "Develop a practical solution"
    ],
    nextAction:
      "Record what is already known and what needs investigation.",
    evidenceStatus: "Investigation not yet performed"
  };
}

// MODULE 3: PROJECT MEMORY
function saveMemory(project, question, result) {
  const entry = {
    id: Date.now().toString(),
    project,
    question,
    result,
    savedAt: new Date().toISOString()
  };

  memory.push(entry);
  return entry;
}

// MODULE 4: ACTION ENGINE
function createActions(question) {
  return {
    question,
    actions: [
      {
        step: 1,
        task: "Clarify the objective",
        status: "pending"
      },
      {
        step: 2,
        task: "Gather relevant information and evidence",
        status: "pending"
      },
      {
        step: 3,
        task: "Evaluate possible solutions",
        status: "pending"
      },
      {
        step: 4,
        task: "Choose and test a practical next step",
        status: "pending"
      }
    ]
  };
}

// NOVA AI INTELLIGENCE CORE
function processQuestion(body) {
  const question =
    typeof body.question === "string"
      ? body.question.trim()
      : "";

  if (!question) {
    return {
      status: 400,
      data: { error: "Please provide a question." }
    };
  }

  if (question.length > 5000) {
    return {
      status: 400,
      data: { error: "Question must be 5000 characters or fewer." }
    };
  }

  const mode = body.mode || "all";
  let result;

  if (mode === "opportunity") {
    result = discoverOpportunity(question);
  } else if (mode === "genesis") {
    result = investigateGenesis(question);
  } else if (mode === "actions") {
    result = createActions(question);
  } else if (mode === "all") {
    result = {
      opportunity: discoverOpportunity(question),
      genesis: investigateGenesis(question),
      actions: createActions(question)
    };
  } else {
    return {
      status: 400,
      data: {
        error: "Mode must be all, opportunity, genesis, or actions."
      }
    };
  }

  const saved = saveMemory(
    typeof body.project === "string" ? body.project : "General",
    question,
    result
  );

  return {
    status: 200,
    data: {
      success: true,
      name: "Nova AI",
      core: "Nova AI Intelligence Core",
      aiModelConnected: false,
      result,
      memory: saved
    }
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, {
      name: "Nova AI",
      stage: "V2",
      status: "Backend ready",
      aiModelConnected: false,
      modules: [
        "Intelligence Core",
        "Opportunity Discovery",
        "Nova Genesis",
        "Project Memory",
        "Action Engine"
      ]
    });
  }

  if (req.method === "GET" && url.pathname === "/api") {
    return send(res, 200, {
      name: "Nova AI",
      message: "Intelligence backend foundation",
      endpoints: {
        health: "GET /api/health",
        process: "POST /api/core",
        memory: "GET /api/memory"
      },
      exampleRequest: {
        question: "How could a small business reach more customers?",
        project: "Nova Agencies",
        mode: "all"
      }
    });
  }

  if (req.method === "GET" && url.pathname === "/api/memory") {
    return send(res, 200, {
      count: memory.length,
      entries: memory,
      storage: "Temporary memory; resets when the server restarts"
    });
  }

  if (req.method === "POST" && url.pathname === "/api/core") {
    try {
      const body = await readBody(req);
      const response = processQuestion(body);
      return send(res, response.status, response.data);
    } catch (error) {
      return send(res, 400, {
        error: error.message || "Request could not be processed."
      });
    }
  }

  return send(res, 404, {
    error: "Endpoint not found",
    available: "GET /api"
  });
});

server.listen(PORT, () => {
  console.log(`Nova AI Core listening on port ${PORT}`);
});
           
