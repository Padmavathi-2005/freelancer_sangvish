import pool from "../config/db.js";

async function addColumn() {
  try {
    console.log("Running migration: ADD COLUMN author_name TO blogs...");
    await pool.query(`
      ALTER TABLE blogs 
      ADD COLUMN IF NOT EXISTS author_name VARCHAR(100);
    `);
    console.log("✅ Column 'author_name' successfully added to blogs table.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

addColumn();
