
const http = require("http");

const PORT = process.env.PORT || 3000;

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

function discoverOpportunity(question) {
  return {
    engine: "Nova Opportunity Discovery",
    question,
    investigationAreas: [
      "Unmet customer needs",
      "Overlooked problems",
      "Existing alternatives",
      "Market and technology changes",
      "Potential ways to create value"
    ],
    nextSteps: [
      "Identify who experiences the problem",
      "Gather evidence from potential users",
      "Compare existing solutions",
      "Test the most promising opportunity"
    ],
    note: "These are investigation areas, not verified market findings."
  };
}

function investigateGenesis(question) {
  return {
    engine: "Nova Genesis",
    question,
    investigationStages: [
      "Define the unanswered question",
      "Review existing knowledge",
      "Identify what remains unknown",
      "Develop testable hypotheses",
      "Design a safe, measurable experiment",
      "Evaluate evidence",
      "Develop or improve a practical solution"
    ],
    nextStep: "State what is already known and what needs to be discovered.",
    note: "No experiment or discovery has been verified automatically."
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
      innovations: [
        "Nova Opportunity Discovery",
        "Nova Genesis"
      ]
    });
  }

  if (req.method === "GET" && url.pathname === "/api") {
    return send(res, 200, {
      name: "Nova AI",
      message: "Intelligence backend is running",
      endpoints: [
        "GET /api/health",
        "POST /api/opportunities",
        "POST /api/genesis"
      ]
    });
  }

  if (req.method === "POST" &&
      ["/api/opportunities", "/api/genesis"].includes(url.pathname)) {
    try {
      const body = await readBody(req);
      const question = typeof body.question === "string"
        ? body.question.trim()
        : "";

      if (!question) {
        return send(res, 400, {
          error: "Please provide a question."
        });
      }

      if (question.length > 5000) {
        return send(res, 400, {
          error: "Question must be 5000 characters or fewer."
        });
      }

      const result = url.pathname === "/api/opportunities"
        ? discoverOpportunity(question)
        : investigateGenesis(question);

      return send(res, 200, {
        success: true,
        ...result
      });
    } catch (error) {
      return send(res, 400, {
        error: error.message || "Could not process request."
      });
    }
  }

  return send(res, 404, {
    error: "Endpoint not found",
    message: "Visit GET /api for available endpoints."
  });
});

server.listen(PORT, () => {
  console.log(`Nova AI listening on port ${PORT}`);
});
          
