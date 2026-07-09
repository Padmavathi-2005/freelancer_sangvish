import pool from "./db.js";

async function runMigration() {
  try {
    console.log("⏳ Starting migration: Converting subscription plans price to numeric and duration to days...");

    // 1. Clean up prices: convert non-numeric strings to numbers
    console.log("🧹 Cleaning up existing price strings...");
    
    // Convert 'Free' to '0'
    await pool.query(`
      UPDATE subscription_plans 
      SET price = '0' 
      WHERE price = 'Free' OR LOWER(price) = 'free' OR price = '' OR price IS NULL;
    `);

    // Convert 'Custom' or other text to '999' or another numeric fallback
    await pool.query(`
      UPDATE subscription_plans 
      SET price = '999' 
      WHERE price = 'Custom' OR LOWER(price) = 'custom';
    `);

    // Clean symbols from other numeric price strings
    const plansRes = await pool.query("SELECT plan_id, price FROM subscription_plans");
    for (const plan of plansRes.rows) {
      const cleanPrice = plan.price.replace(/[^0-9.]/g, "");
      if (cleanPrice !== plan.price) {
        await pool.query(
          "UPDATE subscription_plans SET price = $1 WHERE plan_id = $2",
          [cleanPrice || "0", plan.plan_id]
        );
      }
    }
    console.log("✅ Price strings cleaned.");

    // 2. Alter 'price' column to NUMERIC(10,2)
    console.log("🛠 Altering 'price' column type to NUMERIC(10,2)...");
    await pool.query(`
      ALTER TABLE subscription_plans 
      ALTER COLUMN price TYPE NUMERIC(10,2) USING (price::NUMERIC(10,2));
    `);
    console.log("✅ 'price' column altered to NUMERIC(10,2).");

    // 3. Convert 'plan_duration' to represent days
    console.log("🔄 Converting 'plan_duration' to represent days based on 'plan_type'...");
    
    // Update Month(s) to 30 days
    await pool.query(`
      UPDATE subscription_plans 
      SET plan_duration = plan_duration * 30 
      WHERE LOWER(plan_type) LIKE '%month%';
    `);

    // Update Year(s) to 365 days
    await pool.query(`
      UPDATE subscription_plans 
      SET plan_duration = plan_duration * 365 
      WHERE LOWER(plan_type) LIKE '%year%';
    `);

    // Set 'plan_type' column default to 'Day(s)'
    await pool.query(`
      ALTER TABLE subscription_plans 
      ALTER COLUMN plan_type SET DEFAULT 'Day(s)';
    `);
    
    // Align all plans to 'Day(s)'
    await pool.query(`
      UPDATE subscription_plans 
      SET plan_type = 'Day(s)' 
      WHERE plan_type != 'Day(s)' OR plan_type IS NULL;
    `);

    console.log("✅ Plan durations updated to days.");

    // 4. Update the default/starter constraints if needed
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
