import "dotenv/config";
import pool from "./db.js";

const setupClientVetting = async () => {
  try {
    // 1. Add vetting_status column to client_profiles if not exists
    await pool.query(`
      ALTER TABLE client_profiles 
      ADD COLUMN IF NOT EXISTS vetting_status VARCHAR(50) DEFAULT 'Approved'
    `);
    console.log("✅ 'client_profiles.vetting_status' column added/ready.");

    // 2. Ensure settings exists for enable_client_vetting
    const checkSetting = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'enable_client_vetting'");
    if (checkSetting.rows.length === 0) {
      await pool.query(`
        INSERT INTO settings (category, setting_key, setting_value) 
        VALUES ('site_settings', 'enable_client_vetting', 'false')
      `);
      console.log("✅ 'enable_client_vetting' setting seeded with default 'false'.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

setupClientVetting();
