
const http = require("http");
const knowledge = require("./knowledge");
const evidence = require("./evidence");
const experiments = require("./experiments");
const storage = require("./storage");

const PORT = Number(process.env.PORT) || 3000;
const VERSION = "2.6.0";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

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
    version: VERSION
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

async function generateAI(question, mode, context) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error(
      "OpenAI API key is not configured on the server."
    );
    error.statusCode = 503;
    throw error;
  }

  const instructions = `
You are Nova AI, the intelligence system inside Nova Cloud.

Your purpose is to turn questions, ideas and confusion into clear
understanding and practical action.

For each request:
1. Understand the actual question and the user's objective.
2. Explain the subject clearly and specifically.
3. Separate established facts from assumptions and unknowns.
4. Identify problems, unmet needs, opportunities and alternatives
   when relevant to the question.
5. Use supplied Nova knowledge, evidence and experiments where useful.
6. Recommend practical next actions.
7. Never invent evidence, research findings, statistics or sources.
8. State when current external research is needed but unavailable.
9. Adapt the response to the question instead of forcing every topic
   into a generic business template.

For opportunity discovery, investigate problems, affected people,
unmet needs, potential solutions and ways to validate demand.

For Nova Genesis, explore the idea, existing knowledge, unanswered
questions, experiments, evidence and possible solutions.

Requested mode: ${mode}

Return a useful, readable answer with headings or lists when helpful.
`;

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions,
        input: JSON.stringify({
          question,
          mode,
          existingNovaData: context
        })
      }),
      signal: AbortSignal.timeout(60000)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "OpenAI request failed:",
      response.status,
      data.error?.message || "Unknown API error"
    );

    const error = new Error(
      response.status === 401
        ? "OpenAI authentication failed. Check the API key in Render."
        : response.status === 429
        ? "OpenAI request limit or quota reached. Check API billing and limits."
        : `OpenAI request failed with status ${response.status}.`
    );

    error.statusCode =
      response.status === 429 ? 429 : 502;

    throw error;
  }

  const answer = (data.output || [])
    .flatMap(item => item.content || [])
    .filter(item => item.type === "output_text")
    .map(item => item.text)
    .join("\n")
    .trim();

  if (!answer) {
    throw new Error("OpenAI returned no text answer.");
  }

  return {
    model: data.model || OPENAI_MODEL,
    answer,
    responseId: data.id
  };
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
      version: VERSION,
      status: "healthy",
      engines: Object.keys(engines),
      aiConfigured: Boolean(process.env.OPENAI_API_KEY),
      aiModel: OPENAI_MODEL
    });
  }

  if (method === "POST" && path === "/api/core") {
    const body = await readBody(req);
    const question = String(body.question || "").trim();
    const mode = body.mode || "all";

    if (!question) {
      return send(res, 400, {
        success: false,
        error: "A question is required."
      });
    }

    const result = analyze(question, mode);

    result.ai = await generateAI(
      question,
      mode,
      {
        knowledge: result.relatedKnowledge,
        evidence: result.relatedEvidence,
        experiments: result.relatedExperiments
      }
    );

    result.notice = "AI-powered analysis completed.";

    return send(res, 200, {
      success: true,
      result
    });
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
    console.error("Request failed:", error.message);

    send(res, error.statusCode || 400, {
      success: false,
      error: error.message || "Request failed."
    });
  });
});

try {
  restoreData();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Nova AI v${VERSION} running on port ${PORT}`);
    console.log(`AI model: ${OPENAI_MODEL}`);
    console.log(
      `OpenAI key configured: ${Boolean(process.env.OPENAI_API_KEY)}`
    );
  });
} catch (error) {
  console.error("Nova AI startup failed:", error.message);
  process.exit(1);
    }
      
