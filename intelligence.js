const VERSION = "1.0.0";

function analyze(question, mode = "all", context = {}) {
  const text = String(question || "").trim();

  if (!text) {
    throw new Error("A question is required.");
  }

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2);

  const uniqueWords = [...new Set(words)];

  const related = (records = []) => {
    if (!Array.isArray(records)) return [];

    return records
      .map(record => {
        const content = JSON.stringify(record).toLowerCase();

        const matches = uniqueWords.filter(word =>
          content.includes(word)
        ).length;

        return { record, matches };
      })
      .filter(item => item.matches > 0)
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 10)
      .map(item => item.record);
  };

  const result = {
    question: text,
    mode,
    version: VERSION,
    analysisType: "independent",
    understanding: {
      originalQuestion: text,
      keyTerms: uniqueWords,
      questionLength: text.length
    }
  };

  if (mode === "all" || mode === "opportunity") {
    result.opportunityDiscovery = {
      purpose: "Identify problems and explore potential opportunities.",
      investigation: [
        "Clarify the problem being addressed.",
        "Identify the people affected.",
        "Investigate their needs and current alternatives.",
        "Develop possible solutions.",
        "Identify assumptions that need validation.",
        "Choose a practical next action."
      ],
      questionsToInvestigate: [
        "Who experiences this problem?",
        "How do they currently address it?",
        "What remains difficult or unsolved?",
        "What evidence would demonstrate demand?",
        "How could a possible solution be tested?"
      ]
    };
  }

  if (mode === "all" || mode === "genesis") {
    result.novaGenesis = {
      purpose: "Turn an idea or unanswered question into an investigation.",
      investigation: [
        "Define the idea or question.",
        "Identify existing knowledge.",
        "Find information that is missing.",
        "Develop testable hypotheses.",
        "Design experiments.",
        "Collect and evaluate evidence.",
        "Update conclusions based on findings."
      ],
      questionsToInvestigate: [
        "What is already known?",
        "What remains uncertain?",
        "What assumptions need testing?",
        "What experiment could provide useful evidence?",
        "What results would support or challenge the hypothesis?"
      ]
    };
  }

  const records = {
    knowledge: related(context.knowledge),
    evidence: related(context.evidence),
    experiments: related(context.experiments)
  };

  result.existingData = records;

  result.nextActions = [
    "Review relevant existing knowledge.",
    "Identify the most important unanswered question.",
    "Gather evidence before treating assumptions as facts.",
    "Choose one practical investigation or experiment."
  ];

  result.notice =
    "This analysis uses built-in reasoning structures and supplied records. It does not independently access live internet research or provide verified external findings.";

  return result;
}

module.exports = {
  VERSION,
  analyze
};
