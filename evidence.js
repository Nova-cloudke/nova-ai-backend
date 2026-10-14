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

  const nextId = Math.max(
    0,
    ...evidenceRecords.map(item => Number(item.id) || 0)
  ) + 1;

  const record = {
    id: nextId,
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
    ].some(value =>
      String(value).toLowerCase().includes(term)
    )
  );
}

function getAllEvidence() {
  return [...evidenceRecords];
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

  return getAllEvidence();
}

module.exports = {
  evaluateEvidence,
  searchEvidence,
  getAllEvidence,
  loadEvidence
};
