
"use strict";

const storage = require("./storage.js");

const STORAGE_NAME = "knowledge";
const knowledgeBase = storage.loadData(STORAGE_NAME);

function saveKnowledge() {
  storage.saveData(STORAGE_NAME, knowledgeBase);
}

function addKnowledge({
  topic,
  content,
  source = "User-provided",
  confidence = "unverified",
  tags = []
}) {
  if (
    typeof topic !== "string" ||
    !topic.trim() ||
    typeof content !== "string" ||
    !content.trim()
  ) {
    throw new Error("Topic and content are required.");
  }

  if (!Array.isArray(tags)) {
    throw new Error("Tags must be an array.");
  }

  const nextId = Math.max(
    0,
    ...knowledgeBase.map(item => Number(item.id) || 0)
  ) + 1;

  const entry = {
    id: nextId,
    topic: topic.trim(),
    content: content.trim(),
    source: String(source).trim(),
    confidence: String(confidence),
    tags: tags.map(tag => String(tag).trim()),
    createdAt: new Date().toISOString()
  };

  knowledgeBase.push(entry);
  saveKnowledge();

  return entry;
}

function searchKnowledge(query) {
  const words = String(query || "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return [];

  return knowledgeBase
    .map(entry => {
      const text = [
        entry.topic,
        entry.content,
        ...(entry.tags || [])
      ].join(" ").toLowerCase();

      const score = words.reduce(
        (total, word) =>
          total + (text.includes(word) ? 1 : 0),
        0
      );

      return { ...entry, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

function getAllKnowledge() {
  return knowledgeBase.map(item => ({
    ...item,
    tags: [...(item.tags || [])]
  }));
}

function loadKnowledge(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("Knowledge data must be an array.");
  }

  knowledgeBase.splice(
    0,
    knowledgeBase.length,
    ...entries
  );

  saveKnowledge();
  return getAllKnowledge();
}

function clearKnowledge() {
  knowledgeBase.length = 0;
  saveKnowledge();
}

module.exports = {
  addKnowledge,
  searchKnowledge,
  getAllKnowledge,
  loadKnowledge,
  clearKnowledge
};
                         
