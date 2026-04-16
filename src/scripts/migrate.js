import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(process.cwd(), "db/migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getMigrationFiles() {
  const files = await fs.readdir(migrationsDir);
  return files.filter((file) => file.endsWith(".sql")).sort();
}

async function isAlreadyApplied(filename) {
  const result = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1",
    [filename]
  );
  return result.rowCount > 0;
}

async function applyMigration(filename) {
  const fullPath = path.join(migrationsDir, filename);
  const sql = await fs.readFile(fullPath, "utf8");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1)",
      [filename]
    );
    await client.query("COMMIT");
    console.log(`Applied migration: ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Failed migration: ${filename}`);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  try {
    await ensureMigrationsTable();

    const files = await getMigrationFiles();
    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }

    for (const file of files) {
      const applied = await isAlreadyApplied(file);
      if (!applied) {
        await applyMigration(file);
      }
    }

    console.log("All migrations completed.");
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();