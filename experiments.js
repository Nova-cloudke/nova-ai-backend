const experiments = [];

function createExperiment({
  question,
  hypothesis,
  method,
  expectedOutcome = ""
}) {
  if (!question || !hypothesis || !method) {
    throw new Error(
      "Question, hypothesis, and method are required."
    );
  }

  const nextId = Math.max(
    0,
    ...experiments.map(item => Number(item.id) || 0)
  ) + 1;

  const experiment = {
    id: nextId,
    question: String(question).trim(),
    hypothesis: String(hypothesis).trim(),
    method: String(method).trim(),
    expectedOutcome: String(expectedOutcome).trim(),
    observations: [],
    conclusion: null,
    status: "planned",
    createdAt: new Date().toISOString()
  };

  experiments.push(experiment);
  return experiment;
}

function addObservation(id, observation) {
  const experiment = getExperiment(id);

  if (!experiment) {
    throw new Error("Experiment not found.");
  }

  if (!observation || !String(observation).trim()) {
    throw new Error("An observation is required.");
  }

  experiment.observations.push({
    observation: String(observation).trim(),
    recordedAt: new Date().toISOString()
  });

  experiment.status = "in_progress";
  return experiment;
}

function completeExperiment(id, conclusion) {
  const experiment = getExperiment(id);

  if (!experiment) {
    throw new Error("Experiment not found.");
  }

  if (!conclusion || !String(conclusion).trim()) {
    throw new Error("A conclusion is required.");
  }

  experiment.conclusion = String(conclusion).trim();
  experiment.status = "completed";
  experiment.completedAt = new Date().toISOString();

  return experiment;
}

function getExperiment(id) {
  return experiments.find(
    item => item.id === Number(id)
  ) || null;
}

function getAllExperiments() {
  return experiments.map(item => ({
    ...item,
    observations: [...item.observations]
  }));
}

function searchExperiments(query) {
  const term = String(query || "").toLowerCase().trim();
  if (!term) return [];

  return experiments.filter(item =>
    [
      item.question,
      item.hypothesis,
      item.method,
      item.expectedOutcome,
      item.conclusion || ""
    ].some(value =>
      String(value).toLowerCase().includes(term)
    )
  );
}

function loadExperiments(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("Experiment data must be an array.");
  }

  experiments.splice(
    0,
    experiments.length,
    ...entries
  );

  return getAllExperiments();
}

module.exports = {
  createExperiment,
  addObservation,
  completeExperiment,
  getExperiment,
  getAllExperiments,
  searchExperiments,
  loadExperiments
};
