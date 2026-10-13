
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

  const experiment = {
    id: experiments.length + 1,
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
  const experiment = experiments.find(
    item => item.id === Number(id)
  );

  if (!experiment) {
    throw new Error("Experiment not found.");
  }

  if (!observation || !String(observation).trim()) {
    throw new Error("An observation is required.");
  }

  const record = {
    observation: String(observation).trim(),
    recordedAt: new Date().toISOString()
  };

  experiment.observations.push(record);
  experiment.status = "in_progress";

  return experiment;
}

function completeExperiment(id, conclusion) {
  const experiment = experiments.find(
    item => item.id === Number(id)
  );

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
  return experiments.map(item => ({ ...item }));
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
    ].some(value => value.toLowerCase().includes(term))
  );
}

module.exports = {
  createExperiment,
  addObservation,
  completeExperiment,
  getExperiment,
  getAllExperiments,
  searchExperiments
};
  
