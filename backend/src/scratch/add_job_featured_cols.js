import pool from "../config/db.js";

async function runMigration() {
  try {
    console.log("Running migration: ADD COLUMN is_featured, featured_at TO jobs...");
    await pool.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP;
    `);
    console.log("✅ Columns successfully added to jobs table.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
