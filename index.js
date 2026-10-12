const http = require("http");

const PORT = Number(process.env.PORT) || 3000;

const engines = {
opportunityDiscovery: {
name: "Opportunity Discovery Engine",
purpose: "Discover problems, unmet needs, gaps, and opportunities.",
stages: [
"Understand the idea",
"Identify the problem",
"Investigate needs",
"Discover opportunities",
"Recommend next actions"
]
},
novaGenesis: {
name: "Nova Genesis Engine",
purpose: "Develop ideas into structured projects and innovations.",
stages: [
"Capture the idea",
"Understand its purpose",
"Explore possible solutions",
"Create a development plan",
"Test and improve"
]
}
};

function analyze(input, mode = "all") {
const question = String(input || "").trim();

if (!question) {
return {
success: false,
message: "Please provide a question, problem, or idea."
};
}

const words = question
.replace(/[^\w\s-]/g, "")
.split(/\s+/)
.filter(Boolean);

return {
success: true,
version: "2.0.0",
mode,
question,
understanding: {
summary: "The input concerns: ${question}",
keyTerms: words.slice(0, 12),
problemToExplore:
"Determine the underlying need, who is affected, and what outcome is desired."
},
investigation: {
questions: [
"What evidence supports this idea or problem?",
"Who experiences this need?",
"What solutions already exist?"
],
evidenceStatus: "Not yet researched"
},
opportunities: [
{
title: "Explore possible solutions",
reason: "Investigate unmet needs and compare available alternatives."
}
],
nextActions: [
"Clarify the desired outcome",
"Gather relevant evidence",
"Compare possible solutions",
"Choose a practical next step"
],
engines: Object.keys(engines),
limitations:
"This initial engine uses programmed logic. It does not yet have an AI model, live web research, or verified external evidence."
};
}

function sendJSON(res, status, data) {
res.writeHead(status, {
"Content-Type": "application/json; charset=utf-8",
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type"
});

res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
const url = new URL(
req.url,
"http://${req.headers.host || "localhost"}"
);

if (req.method === "OPTIONS") {
res.writeHead(204, {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type"
});
return res.end();
}

if (
req.method === "GET" &&
["/", "/api", "/api/health", "/health"].includes(url.pathname)
) {
return sendJSON(res, 200, {
success: true,
name: "Nova AI",
version: "2.0.0",
status: "healthy",
message: "Nova AI backend is running."
});
}

if (
req.method === "GET" &&
["/engines", "/api/engines"].includes(url.pathname)
) {
return sendJSON(res, 200, {
success: true,
engines
});
}

if (
req.method === "POST" &&
[
"/api/core",
"/api/analyze",
"/analyze"
].includes(url.pathname)
) {
let body = "";
let finished = false;

req.on("data", chunk => {
  body += chunk.toString();

  if (body.length > 100000 && !finished) {
    finished = true;
    sendJSON(res, 413, {
      success: false,
      message: "Request body is too large."
    });
    req.destroy();
  }
});

req.on("end", () => {
  if (finished) return;

  try {
    const data = JSON.parse(body || "{}");
    const result = analyze(
      data.question || data.input || data.idea,
      data.mode || "all"
    );

    sendJSON(res, result.success ? 200 : 400, result);
  } catch {
    sendJSON(res, 400, {
      success: false,
      message: "Invalid JSON request."
    });
  }
});

return;

}

return sendJSON(res, 404, {
success: false,
message: "Endpoint not found.",
availableEndpoints: [
"GET /api/health",
"POST /api/core",
"GET /api/engines",
"GET /health",
"POST /analyze"
]
});
});

server.listen(PORT, "0.0.0.0", () => {
console.log("Nova AI backend listening on port ${PORT}");
});
