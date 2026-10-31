
"use strict";

const storage = require("./storage.js");

const STORAGE_NAME = "evidence";
const evidenceRecords = storage.loadData(STORAGE_NAME);

function saveEvidence() {
  storage.saveData(STORAGE_NAME, evidenceRecords);
}

function evaluateEvidence({
  claim,
  source,
  evidence,
  type = "unverified"
}) {
  if (
    typeof claim !== "string" || !claim.trim() ||
    typeof source !== "string" || !source.trim() ||
    typeof evidence !== "string" || !evidence.trim()
  ) {
    throw new Error(
      "Claim, source, and evidence are required."
    );
  }

  const allowedTypes = [
    "verified",
    "partially_verified",
    "unverified",
    "contradicted"
  ];

  if (!allowedTypes.includes(type)) {
    throw new Error("Invalid evidence type.");
  }

  const nextId = Math.max(
    0,
    ...evidenceRecords.map(item => Number(item.id) || 0)
  ) + 1;

  const record = {
    id: nextId,
    claim: claim.trim(),
    source: source.trim(),
    evidence: evidence.trim(),
    status: type,
    evaluatedAt: new Date().toISOString()
  };

  evidenceRecords.push(record);
  saveEvidence();

  return record;
}

function searchEvidence(query) {
  const term = String(query || "")
    .toLowerCase()
    .trim();

  if (!term) return [];

  return evidenceRecords.filter(record =>
    [
      record.claim,
      record.source,
      record.evidence,
      record.status
    ].some(value =>
      String(value).toLowerCase().includes(term)
    )
  );
}

function getAllEvidence() {
  return evidenceRecords.map(record => ({
    ...record
  }));
}

function loadEvidence(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("Evidence data must be an array.");
  }

  evidenceRecords.splice(
    0,
    evidenceRecords.length,
    ...entries
  );

  saveEvidence();
  return getAllEvidence();
}

function clearEvidence() {
  evidenceRecords.length = 0;
  saveEvidence();
}

module.exports = {
  evaluateEvidence,
  searchEvidence,
  getAllEvidence,
  loadEvidence,
  clearEvidence
};
    
