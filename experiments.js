
"use strict";

const storage = require("./storage.js");

const STORAGE_NAME = "experiments";
const experiments = storage.loadData(STORAGE_NAME);

function saveExperiments() {
  storage.saveData(STORAGE_NAME, experiments);
}

function createExperiment({
  question,
  hypothesis,
  method,
  expectedOutcome = ""
}) {
  if (
    typeof question !== "string" || !question.trim() ||
    typeof hypothesis !== "string" || !hypothesis.trim() ||
    typeof method !== "string" || !method.trim()
  ) {
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
    question: question.trim(),
    hypothesis: hypothesis.trim(),
    method: method.trim(),
    expectedOutcome: String(expectedOutcome).trim(),
    observations: [],
    conclusion: null,
    status: "planned",
    createdAt: new Date().toISOString()
  };

  experiments.push(experiment);
  saveExperiments();

  return experiment;
}

function addObservation(id, observation) {
  const experiment = getExperiment(id);

  if (!experiment) {
    throw new Error("Experiment not found.");
  }

  if (
    typeof observation !== "string" ||
    !observation.trim()
  ) {
    throw new Error("An observation is required.");
  }

  if (!Array.isArray(experiment.observations)) {
    experiment.observations = [];
  }

  experiment.observations.push({
    observation: observation.trim(),
    recordedAt: new Date().toISOString()
  });

  experiment.status = "in_progress";
  saveExperiments();

  return experiment;
}

function completeExperiment(id, conclusion) {
  const experiment = getExperiment(id);

  if (!experiment) {
    throw new Error("Experiment not found.");
  }

  if (
    typeof conclusion !== "string" ||
    !conclusion.trim()
  ) {
    throw new Error("A conclusion is required.");
  }

  experiment.conclusion = conclusion.trim();
  experiment.status = "completed";
  experiment.completedAt = new Date().toISOString();

  saveExperiments();
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
    observations: [
      ...(item.observations || [])
    ]
  }));
}

function searchExperiments(query) {
  const term = String(query || "")
    .toLowerCase()
    .trim();

  if (!term) return [];

  return getAllExperiments().filter(item =>
    [
      item.question,
      item.hypothesis,
      item.method,
      item.expectedOutcome,
      item.conclusion || "",
      ...(item.observations || []).map(
        entry => entry.observation
      )
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

  saveExperiments();
  return getAllExperiments();
}

function clearExperiments() {
  experiments.length = 0;
  saveExperiments();
}

module.exports = {
  createExperiment,
  addObservation,
  completeExperiment,
  getExperiment,
  getAllExperiments,
  searchExperiments,
  loadExperiments,
  clearExperiments
};
      
