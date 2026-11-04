
"use strict";

const database = require("./database.js");

const DATA_KEYS = {
  knowledge: "knowledge",
  evidence: "evidence",
  experiments: "experiments"
};

const records = {
  knowledge: [],
  evidence: [],
  experiments: []
};

async function initializeEngines() {
  await database.initDatabase();

  for (const [name, key] of Object.entries(DATA_KEYS)) {
    records[name] = await database.loadData(key);
  }

  return true;
}

async function save(name) {
  await database.saveData(DATA_KEYS[name], records[name]);
}

function nextId(items) {
  return Math.max(
    0,
    ...items.map(item => Number(item.id) || 0)
  ) + 1;
}

// KNOWLEDGE

async function addKnowledge({
  topic,
  content,
  source = "User-provided",
  confidence = "unverified",
  tags = []
}) {
  if (!topic?.trim() || !content?.trim()) {
    throw new Error("Topic and content are required.");
  }

  if (!Array.isArray(tags)) {
    throw new Error("Tags must be an array.");
  }

  const entry = {
    id: nextId(records.knowledge),
    topic: topic.trim(),
    content: content.trim(),
    source: String(source).trim(),
    confidence: String(confidence),
    tags: tags.map(tag => String(tag).trim()),
    createdAt: new Date().toISOString()
  };

  records.knowledge.push(entry);
  await save("knowledge");
  return entry;
}

function getAllKnowledge() {
  return records.knowledge.map(item => ({
    ...item,
    tags: [...(item.tags || [])]
  }));
}

function searchKnowledge(query) {
  const words = String(query || "")
    .toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (!words.length) return [];

  return getAllKnowledge()
    .map(item => {
      const text = [
        item.topic,
        item.content,
        ...(item.tags || [])
      ].join(" ").toLowerCase();

      return {
        ...item,
        score: words.filter(word => text.includes(word)).length
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

// EVIDENCE

async function evaluateEvidence({
  claim,
  source,
  evidence,
  type = "unverified"
}) {
  if (!claim?.trim() || !source?.trim() || !evidence?.trim()) {
    throw new Error("Claim, source, and evidence are required.");
  }

  const allowed = [
    "verified",
    "partially_verified",
    "unverified",
    "contradicted"
  ];

  if (!allowed.includes(type)) {
    throw new Error("Invalid evidence type.");
  }

  const record = {
    id: nextId(records.evidence),
    claim: claim.trim(),
    source: source.trim(),
    evidence: evidence.trim(),
    status: type,
    evaluatedAt: new Date().toISOString()
  };

  records.evidence.push(record);
  await save("evidence");
  return record;
}

function getAllEvidence() {
  return records.evidence.map(item => ({ ...item }));
}

function searchEvidence(query) {
  const term = String(query || "").toLowerCase().trim();
  if (!term) return [];

  return getAllEvidence().filter(item =>
    [item.claim, item.source, item.evidence, item.status]
      .some(value => String(value).toLowerCase().includes(term))
  );
}

// EXPERIMENTS

async function createExperiment({
  question,
  hypothesis,
  method,
  expectedOutcome = ""
}) {
  if (!question?.trim() || !hypothesis?.trim() || !method?.trim()) {
    throw new Error("Question, hypothesis, and method are required.");
  }

  const experiment = {
    id: nextId(records.experiments),
    question: question.trim(),
    hypothesis: hypothesis.trim(),
    method: method.trim(),
    expectedOutcome: String(expectedOutcome).trim(),
    observations: [],
    conclusion: null,
    status: "planned",
    createdAt: new Date().toISOString()
  };

  records.experiments.push(experiment);
  await save("experiments");
  return experiment;
}

async function addObservation(id, observation) {
  const experiment = records.experiments.find(
    item => item.id === Number(id)
  );

  if (!experiment) throw new Error("Experiment not found.");
  if (!observation?.trim()) throw new Error("An observation is required.");

  experiment.observations ||= [];
  experiment.observations.push({
    observation: observation.trim(),
    recordedAt: new Date().toISOString()
  });

  experiment.status = "in_progress";
  await save("experiments");
  return experiment;
}

async function completeExperiment(id, conclusion) {
  const experiment = records.experiments.find(
    item => item.id === Number(id)
  );

  if (!experiment) throw new Error("Experiment not found.");
  if (!conclusion?.trim()) throw new Error("A conclusion is required.");

  experiment.conclusion = conclusion.trim();
  experiment.status = "completed";
  experiment.completedAt = new Date().toISOString();

  await save("experiments");
  return experiment;
}

function getAllExperiments() {
  return records.experiments.map(item => ({
    ...item,
    observations: [...(item.observations || [])]
  }));
}

function searchExperiments(query) {
  const term = String(query || "").toLowerCase().trim();
  if (!term) return [];

  return getAllExperiments().filter(item =>
    [
      item.question,
      item.hypothesis,
      item.method,
      item.expectedOutcome,
      item.conclusion || "",
      ...(item.observations || []).map(entry => entry.observation)
    ].some(value => String(value).toLowerCase().includes(term))
  );
}

module.exports = {
  initializeEngines,
  addKnowledge,
  getAllKnowledge,
  searchKnowledge,
  evaluateEvidence,
  getAllEvidence,
  searchEvidence,
  createExperiment,
  addObservation,
  completeExperiment,
  getAllExperiments,
  searchExperiments
};
  
