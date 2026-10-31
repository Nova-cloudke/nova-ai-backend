
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = process.env.NOVA_DATA_DIR
  ? path.resolve(process.env.NOVA_DATA_DIR)
  : path.join(__dirname, "data");

const STORAGE_VERSION = "3.1.0";

function ensureDataDirectory() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(name) {
  if (
    typeof name !== "string" ||
    !/^[a-zA-Z0-9_-]+$/.test(name)
  ) {
    throw new Error("Invalid storage name.");
  }

  return path.join(DATA_DIR, `${name}.json`);
}

function saveData(name, data) {
  ensureDataDirectory();

  const filePath = getFilePath(name);
  const temporaryPath =
    `${filePath}.${process.pid}.tmp`;

  let serialized;

  try {
    serialized = JSON.stringify(data, null, 2);

    if (serialized === undefined) {
      throw new Error("Data cannot be converted to JSON.");
    }

    fs.writeFileSync(
      temporaryPath,
      serialized,
      "utf8"
    );

    fs.renameSync(temporaryPath, filePath);

    return {
      success: true,
      name,
      storageVersion: STORAGE_VERSION,
      savedAt: new Date().toISOString()
    };
  } catch (error) {
    try {
      if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
      }
    } catch (cleanupError) {
      console.error(
        "Temporary file cleanup failed:",
        cleanupError.message
      );
    }

    throw error;
  }
}

function loadData(name) {
  ensureDataDirectory();

  const filePath = getFilePath(name);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);

    return data;
  } catch (error) {
    throw new Error(
      `Unable to load stored data "${name}": ${error.message}`
    );
  }
}

function deleteData(name) {
  ensureDataDirectory();

  const filePath = getFilePath(name);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return {
    success: true,
    name
  };
}

function getStorageInfo() {
  ensureDataDirectory();

  return {
    success: true,
    storageVersion: STORAGE_VERSION,
    storageType: "JSON",
    directory: DATA_DIR,
    persistent: Boolean(process.env.NOVA_DATA_DIR)
  };
}

module.exports = {
  STORAGE_VERSION,
  saveData,
  loadData,
  deleteData,
  getStorageInfo
};
                   
