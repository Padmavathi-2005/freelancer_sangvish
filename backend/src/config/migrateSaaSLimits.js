import pool from "./db.js";

async function runMigration() {
  try {
    console.log("⏳ Starting migration: Setting up SaaS plan limit columns...");

    // 1. Add columns to subscription_plans
    await pool.query(`
      ALTER TABLE subscription_plans 
      ADD COLUMN IF NOT EXISTS proposal_limit INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS job_posting_limit INTEGER DEFAULT 3,
      ADD COLUMN IF NOT EXISTS transaction_fee_percent NUMERIC DEFAULT 5.0,
      ADD COLUMN IF NOT EXISTS featured_job_allowance BOOLEAN DEFAULT FALSE;
    `);
    console.log("✅ SaaS limits columns added to 'subscription_plans' table.");

    // 2. Update default seeded plans
    await pool.query(`
      UPDATE subscription_plans 
      SET proposal_limit = 5, job_posting_limit = 3, transaction_fee_percent = 5.0, featured_job_allowance = FALSE 
      WHERE name = 'Starter';
      
      UPDATE subscription_plans 
      SET proposal_limit = 20, job_posting_limit = 15, transaction_fee_percent = 2.0, featured_job_allowance = TRUE 
      WHERE name = 'Professional';
      
      UPDATE subscription_plans 
      SET proposal_limit = 9999, job_posting_limit = 9999, transaction_fee_percent = 0.0, featured_job_allowance = TRUE 
      WHERE name = 'Enterprise';
    `);
    console.log("✅ Default plans seeded with structured limits successfully.");

    console.log("🎉 SaaS limits schema migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
