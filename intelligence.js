const VERSION = "1.1.0";

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

    if (/\b(compare|versus| vs )\b/.test(normalized)) {
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

  function identifyUnknowns(records) {
    const missing = [];

    if (!records.knowledge.length) {
      missing.push("Relevant existing knowledge has not been recorded.");
    }

    if (!records.evidence.length) {
      missing.push("No matching evidence has been recorded.");
    }

    if (!records.experiments.length) {
      missing.push("No matching experiments have been recorded.");
    }

    return missing;
  }

  const existingData = {
    knowledge: findRelevant(context.knowledge),
    evidence: findRelevant(context.evidence),
    experiments: findRelevant(context.experiments)
  };

  const questionType = classifyQuestion();

  const result = {
    question: text,
    mode,
    version: VERSION,

    analysisType: "independent",

    understanding: {
      originalQuestion: text,
      keyTerms,
      questionLength: text.length,
      questionType
    },

    problemAnalysis: {
      centralQuestion: text,
      investigationFocus: [
        "Identify the actual problem or objective.",
        "Determine who is affected and in what context.",
        "Separate available information from assumptions.",
        "Identify missing information that could change the decision."
      ]
    },

    existingData,

    knowledgeGaps: identifyUnknowns(existingData),

    evidenceAssessment: {
      matchingKnowledgeRecords: existingData.knowledge.length,
      matchingEvidenceRecords: existingData.evidence.length,
      matchingExperiments: existingData.experiments.length,
      warning: "Matching records are not automatically verified. Their quality and relevance must be assessed."
    },

    opportunityDiscovery: {
      purpose: "Identify unmet needs and evaluate possible opportunities.",

      investigation: [
        "Define the problem and desired outcome.",
        "Identify affected customers or users.",
        "Investigate existing alternatives.",
        "Identify unmet needs and possible solutions.",
        "Assess assumptions, risks and feasibility.",
        "Select a small test before making major investments."
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
      "Review the most relevant existing records.",
      "Identify the biggest knowledge gap.",
      "Collect evidence relevant to the actual question.",
      "Choose one practical next step.",
      "Record results so future decisions can improve."
    ],

    notice:
      "Independent analysis organizes the question and available records. It does not independently verify external facts or access live internet research."
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
