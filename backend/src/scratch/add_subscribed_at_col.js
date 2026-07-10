import pool from "../config/db.js";

async function addColumn() {
  try {
    console.log("Running migration: ADD COLUMN active_plan_subscribed_at TO users...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS active_plan_subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log("✅ Column 'active_plan_subscribed_at' successfully added to users table.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

addColumn();
