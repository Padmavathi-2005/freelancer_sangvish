import pool from "./db.js";

async function runMigration() {
  try {
    console.log("⏳ Starting migration: Adding negotiation and discount_percent columns to gigs...");
    
    // Add columns if they do not exist
    await pool.query(`
      ALTER TABLE gigs 
      ADD COLUMN IF NOT EXISTS negotiation BOOLEAN DEFAULT FALSE;
    `);
    console.log("✅ Column 'negotiation' added successfully (or already exists).");

    await pool.query(`
      ALTER TABLE gigs 
      ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0;
    `);
    console.log("✅ Column 'discount_percent' added successfully (or already exists).");

    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
