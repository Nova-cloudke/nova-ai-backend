const VERSION = "1.2.0";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function getKeywords(question) {
  const stopWords = new Set([
    "what", "when", "where", "which", "who", "whom",
    "how", "why", "can", "could", "should", "would",
    "the", "and", "for", "with", "from", "that", "this",
    "are", "was", "were", "has", "have", "had", "into",
    "about", "their", "them", "your", "you", "business",
    "does", "its", "not", "but", "all", "any", "our"
  ]);

  return normalize(question)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

function matchesQuestion(record, keywords) {
  if (!record || typeof record !== "object") return false;

  const content = normalize(
    Object.values(record)
      .filter(value =>
        typeof value === "string" ||
        typeof value === "number"
      )
      .join(" ")
  );

  return keywords.some(word => content.includes(word));
}

function findMatches(records, keywords) {
  if (!Array.isArray(records)) return [];

  return records.filter(record =>
    matchesQuestion(record, keywords)
  );
}

function assessEvidence(evidence) {
  const verified = [];
  const unverified = [];
  const conflicts = [];

  for (const item of evidence) {
    const status = normalize(item.status);

    if (
      status === "conflicting" ||
      status === "disputed" ||
      item.conflict === true
    ) {
      conflicts.push(item);
    } else if (
      status === "verified" &&
      item.source &&
      item.claim
    ) {
      verified.push(item);
    } else {
      unverified.push(item);
    }
  }

  let status = "insufficient";

  if (conflicts.length > 0) {
    status = "conflicting";
  } else if (verified.length > 0) {
    status = "evidence_available";
  }

  return {
    status,
    confidence: verified.length > 0 && conflicts.length === 0
      ? "requires_claim_level_review"
      : "undetermined",
    verifiedClaims: verified.map(item => ({
      claim: item.claim,
      source: item.source,
      date: item.date || null
    })),
    unverifiedEvidenceCount: unverified.length,
    conflictingEvidenceCount: conflicts.length,
    limitations: [
      "A verified label does not automatically prove a claim.",
      "Sources must be checked for credibility, accuracy and relevance.",
      "Missing evidence does not prove a claim is false.",
      "AI-generated statements are not independent evidence."
    ]
  };
}

function classifyQuestion(question) {
  const q = normalize(question);

  if (/customer|consumer|buyer|client|unmet need|market gap/.test(q)) {
    return "customer_research";
  }

  if (/market|competitor|competition|industry|demand/.test(q)) {
    return "market_investigation";
  }

  if (/technology|computer|software|hardware|engine|sensor|how does|how do/.test(q)) {
    return "technology_investigation";
  }

  if (/why|cause|reason|problem|failure|difficult|challenge/.test(q)) {
    return "problem_investigation";
  }

  if (/idea|invent|innovation|develop|design|create|build/.test(q)) {
    return "innovation_investigation";
  }

  if (/business|company|revenue|profit|service|product|growth/.test(q)) {
    return "business_investigation";
  }

  return "general_investigation";
}

function createInvestigationPlan(question, knowledge, evidence, experiments) {
  const type = classifyQuestion(question);

  const plans = {
    customer_research: [
      "Define the customer group and the situation being investigated.",
      "Identify customer needs, difficulties and desired outcomes.",
      "Investigate existing solutions and alternatives.",
      "Identify possible unmet needs without assuming they exist.",
      "Collect customer feedback or other reliable evidence.",
      "Test whether a proposed solution addresses a real need."
    ],

    market_investigation: [
      "Define the market, location and customer segment.",
      "Identify existing providers and alternative solutions.",
      "Investigate customer demand and purchasing behaviour.",
      "Compare available offerings using reliable information.",
      "Identify evidence gaps and uncertain assumptions.",
      "Evaluate possible opportunities and ways to validate them."
    ],

    technology_investigation: [
      "Define the technology and its intended purpose.",
      "Identify its main components, inputs and outputs.",
      "Trace how the technology operates step by step.",
      "Investigate real-world applications and technical requirements.",
      "Examine limitations, costs, risks and maintenance needs.",
      "Identify technical documentation or experiments needed to verify claims."
    ],

    problem_investigation: [
      "Describe the problem and the outcome desired.",
      "Identify who or what is affected and under what conditions.",
      "Separate observed symptoms from possible causes.",
      "Develop alternative explanations.",
      "Identify observations or evidence that could distinguish those explanations.",
      "Test promising solutions and measure their results."
    ],

    innovation_investigation: [
      "Define the idea and the problem it is intended to address.",
      "Identify intended users and their needs.",
      "Investigate existing solutions and their limitations.",
      "List the assumptions that must be tested.",
      "Assess feasibility, costs, risks and required resources.",
      "Design a small experiment or prototype to evaluate the idea."
    ],

    business_investigation: [
      "Define the business and the question to be answered.",
      "Identify customers, products, services and value offered.",
      "Investigate customer needs and buying decisions.",
      "Examine competitors, operations and the business model.",
      "Identify performance evidence and missing information.",
      "Compare improvements and select a measurable next action."
    ],

    general_investigation: [
      "Clarify the question and define the desired understanding.",
      "Identify the main concepts and relevant context.",
      "Record what is already known and how it is known.",
      "List unanswered questions and competing explanations.",
      "Identify reliable sources or observations needed.",
      "Evaluate findings and determine the next investigation."
    ]
  };

  return {
    type,
    steps: plans[type],
    currentKnowledge: knowledge.length,
    matchingEvidence: evidence.length,
    existingExperiments: experiments.length,
    priority: knowledge.length === 0 || evidence.length === 0
      ? "Gather relevant information and evidence."
      : experiments.length === 0
        ? "Determine whether an experiment is needed."
        : "Review existing findings and identify the next unanswered question."
  };
}

function analyze(question, mode = "all", context = {}) {
  const originalQuestion = String(question || "").trim();

  if (!originalQuestion) {
    throw new Error("A question is required for analysis.");
  }

  const keywords = getKeywords(originalQuestion);

  const knowledge = findMatches(context.knowledge, keywords);
  const evidence = findMatches(context.evidence, keywords);
  const experiments = findMatches(context.experiments, keywords);

  const evidenceAssessment = assessEvidence(evidence);

  const investigationPlan = createInvestigationPlan(
    originalQuestion,
    knowledge,
    evidence,
    experiments
  );

  const result = {
    question: originalQuestion,
    mode,
    version: VERSION,
    analysisType: "independent",

    understanding: {
      originalQuestion,
      keyTerms: keywords,
      questionType: investigationPlan.type
    },

    problemAnalysis: {
      centralQuestion: originalQuestion,
      investigationFocus: investigationPlan.steps
    },

    existingData: {
      knowledge,
      evidence,
      experiments
    },

    investigationPlan,

    knowledgeGaps: [
      ...(knowledge.length === 0
        ? ["No matching knowledge records were found."]
        : []),
      ...(evidence.length === 0
        ? ["No matching evidence records were found."]
        : []),
      ...(experiments.length === 0
        ? ["No matching experiments were found."]
        : [])
    ],

    evidenceAssessment,

    hypothesisGuidance: {
      instruction: "Develop possible explanations from the question and available information.",
      requirements: [
        "Label explanations as hypotheses until tested.",
        "Identify evidence that would support or contradict each hypothesis.",
        "Do not present assumptions as established facts."
      ]
    },

    experimentGuidance: {
      requirements: [
        "Define what will be tested.",
        "Specify the observations or measurements required.",
        "Determine what result would support or contradict the hypothesis.",
        "Record the actual outcome.",
        "Update conclusions based on the result."
      ]
    },

    reasoningStandards: {
      distinguishFactsFromAssumptions: true,
      requireEvidenceForVerifiedClaims: true,
      discloseKnowledgeGaps: true,
      acknowledgeConflictingEvidence: true,
      rules: [
        "Never invent sources, statistics or research findings.",
        "Never describe AI-generated claims as independently verified.",
        "Distinguish user-provided information from external evidence.",
        "Check source credibility, publication date and relevance.",
        "Disclose uncertainty and conflicting evidence.",
        "Do not claim to have browsed the internet unless live research occurred."
      ]
    },

    nextActions: [
      investigationPlan.priority,
      "Investigate the highest-priority unanswered question.",
      "Record reliable sources and observations.",
      "Test promising explanations when practical.",
      "Update the investigation when new evidence appears."
    ],

    notice: "This module creates a structured investigation plan. It does not perform live internet research or independently verify claims."
  };

  if (mode === "all" || mode === "opportunityDiscovery") {
    result.opportunityDiscovery = {
      purpose: "Identify unmet needs and evaluate possible opportunities.",
      investigation: [
        "Define the problem and desired outcome.",
        "Identify affected customers.",
        "Investigate existing alternatives.",
        "Identify possible unmet needs.",
        "Compare potential solutions.",
        "Assess feasibility, risks and assumptions.",
        "Validate demand before investing."
      ]
    };
  }

  if (mode === "all" || mode === "novaGenesis") {
    result.novaGenesis = {
      purpose: "Turn unanswered questions into structured investigations.",
      stages: [
        "Understand the question.",
        "Examine existing knowledge.",
        "Identify knowledge gaps.",
        "Develop testable hypotheses.",
        "Design experiments.",
        "Collect and evaluate evidence.",
        "Update conclusions.",
        "Recommend practical next actions."
      ],
      investigationPlan
    };
  }

  return result;
}

module.exports = {
  VERSION,
  analyze
};
