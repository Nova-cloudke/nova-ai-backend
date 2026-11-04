
"use strict";

const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  },
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nova_storage (
      storage_key TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return true;
}

async function loadData(key) {
  const result = await pool.query(
    "SELECT data FROM nova_storage WHERE storage_key = $1",
    [key]
  );

  return result.rows.length ? result.rows[0].data : [];
}

async function saveData(key, data) {
  if (!Array.isArray(data)) {
    throw new Error("Stored data must be an array.");
  }

  await pool.query(
    `INSERT INTO nova_storage (storage_key, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (storage_key)
     DO UPDATE SET data = EXCLUDED.data,
                   updated_at = NOW()`,
    [key, JSON.stringify(data)]
  );

  return true;
}

async function getStorageInfo() {
  const result = await pool.query("SELECT 1");

  return {
    success: result.rowCount === 1,
    storageType: "Supabase PostgreSQL",
    persistent: true
  };
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  pool,
  initDatabase,
  loadData,
  saveData,
  getStorageInfo,
  closeDatabase
};
                   
