import pool from "./db.js";

async function runMigration() {
  try {
    console.log("⏳ Starting migration: Adding payment_type, min_price, max_price, and milestones columns to gigs...");
    await pool.query(`
      ALTER TABLE gigs 
      ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'fixed',
      ADD COLUMN IF NOT EXISTS min_price NUMERIC,
      ADD COLUMN IF NOT EXISTS max_price NUMERIC,
      ADD COLUMN IF NOT EXISTS milestones JSONB;
    `);
    console.log("✅ Columns payment_type, min_price, max_price, and milestones added successfully (or already exist).");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  }
}

export default runMigration;
