const http = require("http");

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
"Explore solutions",
"Create a development plan",
"Test and improve"
]
}
};

function analyze(question, mode) {
if (typeof question !== "string" || !question.trim()) {
return {
success: false,
message: "Please provide a question or idea."
};
}

return {
success: true,
name: "Nova AI",
version: "2.0.0",
mode: mode || "all",
question: question.trim(),
understanding: {
summary: "Understanding the question and intended outcome.",
problemToExplore:
"Identify the need, affected users, and desired result."
},
investigation: {
questions: [
"What evidence supports this problem?",
"Who experiences this need?",
"What solutions already exist?"
],
evidenceStatus: "Not yet researched"
},
opportunities: [
{
title: "Explore possible solutions",
nextStep: "Investigate needs and compare alternatives."
}
],
nextActions: [
"Clarify the desired outcome",
"Gather evidence",
"Compare alternatives",
"Choose a practical next action"
],
engines: Object.keys(engines),
limitations:
"This is programmed logic, not an AI model. Live research is not connected yet."
};
}

function respond(res, status, data) {
res.writeHead(status, {
"Content-Type": "application/json; charset=utf-8",
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type"
});
res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
const path = (req.url || "/").split("?")[0];

if (req.method === "OPTIONS") {
res.writeHead(204);
return res.end();
}

if (
req.method === "GET" &&
["/", "/api/health", "/health"].includes(path)
) {
return respond(res, 200, {
success: true,
name: "Nova AI",
version: "2.0.0",
status: "healthy",
message: "Nova AI backend is running."
});
}

if (
req.method === "GET" &&
["/api/engines", "/engines"].includes(path)
) {
return respond(res, 200, {
success: true,
engines
});
}

if (
req.method === "POST" &&
["/api/core", "/api/analyze", "/analyze"].includes(path)
) {
let body = "";
let tooLarge = false;

req.on("data", chunk => {
  body += chunk.toString();

  if (body.length > 100000) {
    tooLarge = true;
    respond(res, 413, {
      success: false,
      message: "Request body is too large."
    });
    req.destroy();
  }
});

req.on("end", () => {
  if (tooLarge) return;

  try {
    const data = JSON.parse(body || "{}");
    const question =
      data.question || data.input || data.idea || "";
    const result = analyze(question, data.mode || "all");

    return respond(res, result.success ? 200 : 400, result);
  } catch (error) {
    return respond(res, 400, {
      success: false,
      message: "Invalid JSON request."
    });
  }
});

return;

}

return respond(res, 404, {
success: false,
message: "Endpoint not found."
});
});

server.listen(PORT, "0.0.0.0", () => {
console.log("Nova AI backend listening on port " + PORT);
});
