import pool from "./db.js";

async function runMigration() {
  try {
    console.log("⏳ Starting migration: Setting up plan discount columns...");

    // 1. Add gig_discount_percent to subscription_plans
    await pool.query(`
      ALTER TABLE subscription_plans 
      ADD COLUMN IF NOT EXISTS gig_discount_percent INTEGER DEFAULT 0;
    `);
    console.log("✅ Column 'gig_discount_percent' added to 'subscription_plans'.");

    // 2. Add active_plan_id to users
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS active_plan_id INTEGER DEFAULT 1 REFERENCES subscription_plans(plan_id);
    `);
    console.log("✅ Column 'active_plan_id' added to 'users'.");

    // 3. Update existing seed plan discounts if not already set
    await pool.query(`
      UPDATE subscription_plans SET gig_discount_percent = 0 WHERE name = 'Starter';
      UPDATE subscription_plans SET gig_discount_percent = 10 WHERE name = 'Professional';
      UPDATE subscription_plans SET gig_discount_percent = 20 WHERE name = 'Enterprise';
    `);
    console.log("✅ Default subscription plans updated with discount percentages (Starter: 0%, Professional: 10%, Enterprise: 20%).");

    console.log("🎉 Discount schema migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
