const VERSION = "1.2.0";

function analyze(question, mode = "all", context = {}) {
  const text = String(question || "").trim();

  if (!text) {
    throw new Error("A question is required.");
  }

  const normalized = text.toLowerCase();

  const stopWords = new Set([
    "the", "and", "for", "are", "but", "not", "you",
    "your", "can", "how", "what", "why", "when", "where",
    "who", "does", "did", "has", "have", "had", "with",
    "from", "that", "this", "will", "would", "could",
    "should", "into", "about", "more", "some", "their",
    "they", "them", "its", "our", "out", "all"
  ]);

  const words = normalized
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  const keyTerms = [...new Set(words)];

  function findRelevant(records = []) {
    if (!Array.isArray(records)) return [];

    return records
      .map(record => {
        const content = JSON.stringify(record).toLowerCase();

        const matches = keyTerms.filter(term =>
          content.includes(term)
        ).length;

        return { record, matches };
      })
      .filter(item => item.matches > 0)
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 10)
      .map(item => item.record);
  }

  function classifyQuestion() {
    if (/\b(opportunity|opportunities|market gap|unmet need)\b/.test(normalized)) {
      return "opportunity";
    }

    if (/\b(experiment|hypothesis|investigate|unknown|unanswered)\b/.test(normalized)) {
      return "investigation";
    }

    if (/\b(compare|versus)\b/.test(normalized) || normalized.includes(" vs ")) {
      return "comparison";
    }

    if (/\b(strategy|strategic plan|grow|growth|improve|increase|attract)\b/.test(normalized)) {
      return "strategy";
    }

    if (/\b(what is|explain|how does|how do|meaning)\b/.test(normalized)) {
      return "explanation";
    }

    return "general";
  }

  const existingData = {
    knowledge: findRelevant(context.knowledge),
    evidence: findRelevant(context.evidence),
    experiments: findRelevant(context.experiments)
  };

  function assessEvidence(records) {
    const items = records.evidence;

    if (items.length === 0) {
      return {
        status: "insufficient",
        confidence: "undetermined",
        reason: "No matching evidence records were found.",
        verifiedClaims: [],
        limitations: [
          "No supporting evidence is available in the matched records.",
          "AI-generated claims must not be treated as verified facts."
        ]
      };
    }

    const assessed = items.map(item => {
      const source = item.source || item.sourceUrl || null;
      const hasSource = Boolean(source);

      const verificationStatus =
        String(item.verificationStatus || item.status || "")
          .toLowerCase();

      const explicitlyVerified = [
        "verified",
        "confirmed",
        "validated"
      ].includes(verificationStatus);

      return {
        evidence: item,
        hasSource,
        explicitlyVerified
      };
    });

    const verifiedCount = assessed.filter(
      item => item.explicitlyVerified && item.hasSource
    ).length;

    return {
      status: verifiedCount > 0
        ? "recorded_verified_status"
        : "recorded_unverified",

      confidence: "requires_review",

      matchingEvidenceCount: items.length,
      recordsMarkedVerifiedWithSources: verifiedCount,

      reason:
        "Stored records and source references require appropriate review. A verification label alone does not establish that a claim is true.",

      verifiedClaims: [],

      limitations: [
        "Evidence relevance must be checked against the specific claim.",
        "Sources must be inspected for reliability and date.",
        "Conflicting evidence must be considered.",
        "A stored status is not independent verification."
      ]
    };
  }

  function identifyUnknowns(records) {
    const missing = [];

    if (!records.knowledge.length) {
      missing.push("No matching knowledge records were found.");
    }

    if (!records.evidence.length) {
      missing.push("No matching evidence records were found.");
    }

    if (!records.experiments.length) {
      missing.push("No matching experiments were found.");
    }

    return missing;
  }

  const result = {
    question: text,
    mode,
    version: VERSION,
    analysisType: "independent",

    understanding: {
      originalQuestion: text,
      keyTerms,
      questionLength: text.length,
      questionType: classifyQuestion()
    },

    problemAnalysis: {
      centralQuestion: text,

      investigationFocus: [
        "Identify the actual problem or objective.",
        "Determine who is affected and in what context.",
        "Separate recorded information from assumptions.",
        "Identify missing information that could change the decision.",
        "Determine what evidence would support a conclusion."
      ]
    },

    existingData,

    knowledgeGaps: identifyUnknowns(existingData),

    evidenceAssessment: assessEvidence(existingData),

    reasoningStandards: {
      distinguishFactsFromAssumptions: true,
      requireEvidenceForVerifiedClaims: true,
      discloseKnowledgeGaps: true,
      acknowledgeConflictingEvidence: true,

      rules: [
        "Do not present assumptions as established facts.",
        "Do not invent statistics, sources, research findings, or quotations.",
        "A source reference does not automatically prove a claim.",
        "Distinguish user-provided information from independently verified information.",
        "When evidence is missing, explain what needs investigation.",
        "When sources disagree, describe the disagreement.",
        "Do not claim to have browsed the internet unless live research was actually performed."
      ]
    },

    opportunityDiscovery: {
      purpose: "Identify unmet needs and evaluate possible opportunities.",

      investigation: [
        "Define the problem and desired outcome.",
        "Identify affected customers or users.",
        "Investigate existing alternatives.",
        "Identify possible unmet needs.",
        "Generate potential solutions.",
        "Evaluate feasibility, risks, and assumptions.",
        "Validate demand before making major investments."
      ],

      questionsToInvestigate: [
        "Who experiences the problem?",
        "What evidence shows that the problem exists?",
        "What alternatives are currently available?",
        "What remains difficult or unsolved?",
        "Would people use or pay for a proposed solution?",
        "How can the opportunity be tested at low cost?"
      ]
    },

    novaGenesis: {
      purpose: "Turn unanswered questions into structured investigations.",

      investigation: [
        "Define the unanswered question.",
        "Record existing knowledge.",
        "Identify missing information.",
        "Form a testable hypothesis.",
        "Design an experiment.",
        "Collect observations and evidence.",
        "Evaluate the results.",
        "Update conclusions when new evidence appears."
      ],

      questionsToInvestigate: [
        "What is already known?",
        "What remains uncertain?",
        "Which assumptions could be wrong?",
        "What test would reduce uncertainty?",
        "What results would support or challenge the hypothesis?"
      ]
    },

    nextActions: [
      "Review relevant knowledge and evidence.",
      "Identify the most important unanswered question.",
      "Find reliable sources or collect real-world observations.",
      "Evaluate the evidence against the specific claim.",
      "Choose one practical next action.",
      "Record the outcome for future investigations."
    ],

    notice:
      "Independent analysis organizes the question and available records. It does not itself verify external claims or access live internet research."
  };

  if (mode === "opportunity") {
    delete result.novaGenesis;
  } else if (mode === "genesis") {
    delete result.opportunityDiscovery;
  }

  return result;
}

module.exports = {
  VERSION,
  analyze
};
