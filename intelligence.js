const VERSION = "1.1.0";

function normalize(value) {
  return String(value || "").toLowerCase();
}

function getKeywords(question) {
  const stopWords = new Set([
    "what", "when", "where", "which", "who", "whom",
    "how", "why", "can", "could", "should", "would",
    "the", "and", "for", "with", "from", "that", "this",
    "are", "was", "were", "has", "have", "had", "into",
    "about", "their", "them", "your", "you", "business"
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
    const conclusion = normalize(item.conclusion);

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

  let assessmentStatus = "insufficient";
  let confidence = "undetermined";

  if (conflicts.length > 0) {
    assessmentStatus = "conflicting";
    confidence = "undetermined";
  } else if (verified.length > 0) {
    assessmentStatus = "evidence_available";
    confidence = "requires_claim_level_review";
  }

  return {
    status: assessmentStatus,
    confidence,
    verifiedClaims: verified.map(item => ({
      claim: item.claim,
      source: item.source,
      date: item.date || null
    })),
    unverifiedEvidenceCount: unverified.length,
    conflictingEvidenceCount: conflicts.length,
    reason: verified.length === 0
      ? "No evidence records meeting the verification requirements were found."
      : "Evidence records were found. Each source and claim must still be checked for relevance, reliability and accuracy.",
    limitations: [
      "An evidence record marked verified is not automatically proof that its claim is true.",
      "AI-generated statements are not independent evidence.",
      "Missing evidence must not be interpreted as proof that a claim is false.",
      "Current market conditions require up-to-date sources or observations."
    ]
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

  const result = {
    question: originalQuestion,
    mode,
    version: VERSION,
    analysisType: "independent",

    understanding: {
      originalQuestion,
      keyTerms: keywords,
      questionLength: originalQuestion.length,
      questionType: /how|strategy|improve|increase|grow/i.test(originalQuestion)
        ? "strategy"
        : /why|cause|reason/i.test(originalQuestion)
          ? "investigation"
          : "general"
    },

    problemAnalysis: {
      centralQuestion: originalQuestion,
      investigationFocus: [
        "Define the problem and desired outcome.",
        "Separate recorded facts from assumptions.",
        "Identify missing information.",
        "Determine what evidence would support each claim.",
        "Identify practical ways to test possible solutions."
      ]
    },

    existingData: {
      knowledge,
      evidence,
      experiments
    },

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

    reasoningStandards: {
      distinguishFactsFromAssumptions: true,
      requireEvidenceForVerifiedClaims: true,
      discloseKnowledgeGaps: true,
      acknowledgeConflictingEvidence: true,
      rules: [
        "Never invent sources, statistics, quotations or research findings.",
        "Never describe AI-generated claims as independently verified.",
        "Include source references for factual claims that require verification.",
        "Distinguish user-provided information from independently verified findings.",
        "Check source credibility, publication date and relevance.",
        "Disclose uncertainty and conflicting evidence.",
        "Do not claim to have browsed the internet unless live research occurred."
      ]
    },

    nextActions: [
      "Identify the most important unanswered question.",
      "Find reliable sources or collect real-world observations.",
      "Check each important claim against its supporting evidence.",
      "Test promising solutions using measurable outcomes.",
      "Record findings and update conclusions when new evidence appears."
    ],

    notice: "Independent analysis completed. This module does not perform live internet research."
  };

  if (mode === "all" || mode === "opportunityDiscovery") {
    result.opportunityDiscovery = {
      purpose: "Identify unmet needs and evaluate possible opportunities.",
      investigation: [
        "Define the problem and desired outcome.",
        "Identify affected customers.",
        "Investigate existing alternatives.",
        "Identify unmet needs.",
        "Compare potential solutions.",
        "Assess feasibility, risks and assumptions.",
        "Validate demand before investing."
      ]
    };
  }

  if (mode === "all" || mode === "novaGenesis") {
    result.novaGenesis = {
      purpose: "Turn unanswered questions into structured investigations.",
      investigation: [
        "Define the unanswered question.",
        "Record existing knowledge.",
        "Identify missing information.",
        "Form a testable hypothesis.",
        "Design an experiment.",
        "Collect observations and evidence.",
        "Evaluate results and update conclusions."
      ]
    };
  }

  return result;
}

module.exports = {
  VERSION,
  analyze
};
