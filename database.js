
"use strict";

const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;
let databaseReady = false;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });

  pool.on("error", (error) => {
    databaseReady = false;
    console.error("Nova AI database connection error:", error.message);
  });
} else {
  console.warn(
    "Nova AI: DATABASE_URL is missing. Database storage is unavailable."
  );
}

async function initDatabase() {
  if (!pool) {
    databaseReady = false;
    return false;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nova_storage (
        storage_key TEXT PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    databaseReady = true;

    console.log("Nova AI database initialized successfully.");

    return true;
  } catch (error) {
    databaseReady = false;

    console.error(
      "Nova AI database initialization failed:",
      error.message
    );

    return false;
  }
}

function requireDatabase() {
  if (!pool || !databaseReady) {
    throw new Error(
      "Nova AI database is unavailable. Check PostgreSQL connectivity."
    );
  }
}

async function loadData(key) {
  requireDatabase();

  const result = await pool.query(
    "SELECT data FROM nova_storage WHERE storage_key = $1",
    [key]
  );

  return result.rows.length ? result.rows[0].data : [];
}

async function saveData(key, data) {
  requireDatabase();

  if (!Array.isArray(data)) {
    throw new Error("Stored data must be an array.");
  }

  await pool.query(
    `INSERT INTO nova_storage (storage_key, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (storage_key)
     DO UPDATE SET
       data = EXCLUDED.data,
       updated_at = NOW()`,
    [key, JSON.stringify(data)]
  );

  return true;
}

async function getStorageInfo() {
  if (!pool || !databaseReady) {
    return {
      success: false,
      storageType: "PostgreSQL",
      persistent: false,
      status: "unavailable"
    };
  }

  try {
    await pool.query("SELECT 1");

    return {
      success: true,
      storageType: "PostgreSQL",
      persistent: true,
      status: "connected"
    };
  } catch (error) {
    databaseReady = false;

    return {
      success: false,
      storageType: "PostgreSQL",
      persistent: false,
      status: "unavailable"
    };
  }
}

async function closeDatabase() {
  databaseReady = false;

  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  get pool() {
    return pool;
  },
  initDatabase,
  loadData,
  saveData,
  getStorageInfo,
  closeDatabase
};
  
