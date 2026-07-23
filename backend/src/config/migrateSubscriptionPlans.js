import pool from "./db.js";

async function migrate() {
  try {
    console.log("⏳ Initializing 'subscription_plans' database table...");

    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        plan_id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        price VARCHAR(50) NOT NULL,
        period VARCHAR(50),
        features JSONB NOT NULL,
        button_text VARCHAR(50) NOT NULL,
        is_popular BOOLEAN DEFAULT FALSE,
        is_current BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'subscription_plans' table ready.");

    // Seed default values if table is empty
    const check = await pool.query("SELECT COUNT(*) FROM subscription_plans");
    if (parseInt(check.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO subscription_plans (name, description, price, period, features, button_text, is_popular, is_current)
        VALUES 
        ('Starter', 'For individuals and small teams.', 'Free', '', '["Basic talent search", "Standard support", "5% transaction fee"]', 'Current Plan', FALSE, TRUE),
        ('Professional', 'For growing businesses needing top talent.', '₹999', '/month', '["Advanced AI matching", "Priority 24/7 support", "2% transaction fee", "Dedicated account manager"]', 'Upgrade Now', TRUE, FALSE),
        ('Enterprise', 'Custom solutions for large organizations.', 'Custom', '', '["Unlimited talent search", "Dedicated success team", "0% transaction fee", "Custom API integration"]', 'Buy Plan', FALSE, FALSE)
      `);
      console.log("🌱 Seeded default subscription plans (Starter, Professional, Enterprise).");
    }
  } catch (error) {
    console.error("❌ Error running migration:", error.message);
  } finally {
    await pool.end();
    console.log("🔌 Database migration connection closed.");
  }
}

migrate();
