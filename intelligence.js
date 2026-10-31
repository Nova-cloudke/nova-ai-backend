
"use strict";

const VERSION = "3.1.0";

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

function recordText(record) {
  if (!record || typeof record !== "object") return "";

  return Object.values(record)
    .flatMap(value => {
      if (Array.isArray(value)) {
        return value.map(item =>
          typeof item === "object" && item !== null
            ? Object.values(item).join(" ")
            : String(item)
        );
      }

      if (value && typeof value === "object") {
        return Object.values(value).join(" ");
      }

      return [String(value ?? "")];
    })
    .join(" ")
    .toLowerCase();
}

function findMatches(records, keywords) {
  if (!Array.isArray(records)) return [];

  return records
    .map(record => {
      const content = recordText(record);

      const matchedKeywords = keywords.filter(word =>
        content.includes(word)
      );

      return {
        record,
        score: matchedKeywords.length,
        matchedKeywords
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => ({
      ...item.record,
      relevanceScore: item.score,
      matchedKeywords: item.matchedKeywords
    }));
}

function assessEvidence(evidence) {
  const verified = [];
  const partiallyVerified = [];
  const unverified = [];
  const contradicted = [];
  const conflicts = [];

  for (const item of evidence) {
    const status = normalize(item.status);

    if (
      status === "conflicting" ||
      status === "disputed" ||
      item.conflict === true
    ) {
      conflicts.push(item);
    } else if (status === "contradicted") {
      contradicted.push(item);
    } else if (status === "partially_verified") {
      partiallyVerified.push(item);
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

  if (conflicts.length || contradicted.length) {
    status = "requires_review";
  } else if (
    verified.length ||
    partiallyVerified.length
  ) {
    status = "evidence_available";
  }

  return {
    status,
    confidence: "requires_claim_level_review",

    verifiedClaims: verified.map(item => ({
      claim: item.claim,
      source: item.source,
      date: item.date || item.evaluatedAt || null
    })),

    partiallyVerifiedClaims: partiallyVerified.map(item => ({
      claim: item.claim,
      source: item.source,
      evidence: item.evidence
    })),

    unverifiedEvidenceCount: unverified.length,
    contradictedEvidenceCount: contradicted.length,
    conflictingEvidenceCount: conflicts.length,

    limitations: [
      "A verified label does not automatically prove a claim.",
      "Sources must be checked for credibility, accuracy and relevance.",
      "Missing evidence does not prove a claim is false.",
      "Partially verified claims require additional investigation.",
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

function createInvestigationPlan(
  question,
  knowledge,
  evidence,
  experiments
) {
  const type = classifyQuestion(question);

  const plans = {
    customer_research: [
      "Define the customer group and situation.",
      "Identify customer needs and difficulties.",
      "Investigate existing solutions.",
      "Identify possible unmet needs.",
      "Collect customer feedback and evidence.",
      "Test whether a proposed solution addresses a real need."
    ],

    market_investigation: [
      "Define the market and customer segment.",
      "Identify existing providers and alternatives.",
      "Investigate customer demand.",
      "Compare available offerings.",
      "Identify evidence gaps and assumptions.",
      "Evaluate possible opportunities."
    ],

    technology_investigation: [
      "Define the technology and its purpose.",
      "Identify its main components and functions.",
      "Trace how it operates.",
      "Investigate real-world applications.",
      "Examine limitations, costs and risks.",
      "Identify documentation or experiments needed."
    ],

    problem_investigation: [
      "Describe the problem and desired outcome.",
      "Identify who or what is affected.",
      "Separate symptoms from possible causes.",
      "Develop alternative explanations.",
      "Identify evidence that can test those explanations.",
      "Evaluate possible solutions."
    ],

    innovation_investigation: [
      "Define the idea and problem it addresses.",
      "Identify intended users and their needs.",
      "Investigate existing solutions.",
      "List assumptions that must be tested.",
      "Assess feasibility and risks.",
      "Design an experiment or prototype."
    ],

    business_investigation: [
      "Define the business question.",
      "Identify customers, products and services.",
      "Investigate customer needs and buying decisions.",
      "Examine competition and operations.",
      "Identify missing business information.",
      "Compare improvements and select a next action."
    ],

    general_investigation: [
      "Clarify the question.",
      "Identify relevant concepts and context.",
      "Examine existing knowledge.",
      "List unanswered questions.",
      "Identify reliable information needed.",
      "Evaluate findings and determine next steps."
    ]
  };

  return {
    type,
    steps: plans[type],
    currentKnowledge: knowledge.length,
    matchingEvidence: evidence.length,
    existingExperiments: experiments.length,

    priority:
      knowledge.length === 0 || evidence.length === 0
        ? "Gather relevant information and evidence."
        : experiments.length === 0
          ? "Determine whether an experiment is needed."
          : "Review existing findings and identify unanswered questions."
  };
}

function analyze(question, mode = "all", context = {}) {
  const originalQuestion = String(question || "").trim();

  if (!originalQuestion) {
    throw new Error("A question is required for analysis.");
  }

  const keywords = getKeywords(originalQuestion);

  const knowledge = findMatches(
    context.knowledge,
    keywords
  );

  const evidence = findMatches(
    context.evidence,
    keywords
  );

  const experiments = findMatches(
    context.experiments,
    keywords
  );

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
      instruction: "Develop possible explanations from available information.",

      requirements: [
        "Label explanations as hypotheses until tested.",
        "Identify evidence that could support or contradict each hypothesis.",
        "Do not present assumptions as established facts."
      ]
    },

    experimentGuidance: {
      requirements: [
        "Define what will be tested.",
        "Specify required observations or measurements.",
        "Determine what results would support or contradict the hypothesis.",
        "Record actual outcomes.",
        "Update conclusions using the results."
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
        "Check source credibility, date and relevance.",
        "Disclose uncertainty and conflicting evidence.",
        "Do not claim live research unless it occurred."
      ]
    },

    nextActions: [
      investigationPlan.priority,
      "Investigate the highest-priority unanswered question.",
      "Record reliable sources and observations.",
      "Test promising explanations when practical.",
      "Update the investigation when new evidence appears."
    ],

    notice: "This module creates structured investigation plans. It does not perform live internet research or independently verify claims."
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
        "Assess feasibility and risks.",
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
         
