import pool from "./db.js";

async function run() {
  console.log("🚀 Creating dynamic landing page sections tables...");
  try {
    // 1. Create why_choose_features table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS why_choose_features (
        feature_id SERIAL PRIMARY KEY,
        key_suffix VARCHAR(50) UNIQUE NOT NULL,
        sort_order INT DEFAULT 0,
        icon_name VARCHAR(100) DEFAULT 'Shield',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'why_choose_features' table ready.");

    // 2. Create how_it_works_steps table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS how_it_works_steps (
        step_id SERIAL PRIMARY KEY,
        key_suffix VARCHAR(50) UNIQUE NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'how_it_works_steps' table ready.");

    // 3. Seed default why_choose_features
    const wcCheck = await pool.query("SELECT COUNT(*) FROM why_choose_features");
    if (parseInt(wcCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO why_choose_features (key_suffix, sort_order, icon_name) VALUES
        ('1', 1, 'Shield'),
        ('2', 2, 'Cpu'),
        ('3', 3, 'Lock'),
        ('4', 4, 'Headphones'),
        ('5', 5, 'Clock'),
        ('6', 6, 'MessageSquare')
      `);
      console.log("🌱 Seeded default Why Choose features.");
    }

    // 4. Seed default how_it_works_steps
    const hwCheck = await pool.query("SELECT COUNT(*) FROM how_it_works_steps");
    if (parseInt(hwCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO how_it_works_steps (key_suffix, sort_order) VALUES
        ('1', 1),
        ('2', 2),
        ('3', 3),
        ('4', 4),
        ('5', 5)
      `);
      console.log("🌱 Seeded default How It Works steps.");
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
