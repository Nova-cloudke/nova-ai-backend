
const evidenceRecords = [];

function evaluateEvidence({
  claim,
  source,
  evidence,
  type = "unverified"
}) {
  if (!claim || !source || !evidence) {
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

  const record = {
    id: evidenceRecords.length + 1,
    claim: String(claim).trim(),
    source: String(source).trim(),
    evidence: String(evidence).trim(),
    status: type,
    evaluatedAt: new Date().toISOString()
  };

  evidenceRecords.push(record);
  return record;
}

function searchEvidence(query) {
  const term = String(query || "").toLowerCase().trim();

  if (!term) return [];

  return evidenceRecords.filter(record =>
    [
      record.claim,
      record.source,
      record.evidence,
      record.status
    ].some(value => value.toLowerCase().includes(term))
  );
}

function getAllEvidence() {
  return [...evidenceRecords];
}

module.exports = {
  evaluateEvidence,
  searchEvidence,
  getAllEvidence
};
    
