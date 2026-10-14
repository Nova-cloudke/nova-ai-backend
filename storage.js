const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

function ensureDataDirectory() {
if (!fs.existsSync(DATA_DIR)) {
fs.mkdirSync(DATA_DIR, { recursive: true });
}
}

function getFilePath(name) {
if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
throw new Error("Invalid storage name.");
}

return path.join(DATA_DIR, `${name}.json`);
}

function saveData(name, data) {
ensureDataDirectory();

const filePath = getFilePath(name);
const temporaryPath = `${filePath}.tmp`;

fs.writeFileSync(
temporaryPath,
JSON.stringify(data, null, 2),
"utf8"
);

fs.renameSync(temporaryPath, filePath);

return {
success: true,
name,
savedAt: new Date().toISOString()
};
}

function loadData(name) {
ensureDataDirectory();

const filePath = getFilePath(name);

if (!fs.existsSync(filePath)) {
return [];
}

try {
return JSON.parse(fs.readFileSync(filePath, "utf8"));
} catch {
throw new Error(Stored data for "${name}" is invalid.);
}
}

function deleteData(name) {
ensureDataDirectory();

const filePath = getFilePath(name);

if (fs.existsSync(filePath)) {
fs.unlinkSync(filePath);
}

return { success: true, name };
}

module.exports = {
saveData,
loadData,
deleteData
};
