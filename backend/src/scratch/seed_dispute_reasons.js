import pool from '../config/db.js';

const check = await pool.query("SELECT * FROM settings WHERE setting_key = 'dispute_reasons'");
if (check.rows.length === 0) {
  const reasons = [
    "Work not delivered",
    "Work quality is poor",
    "Requirements not followed",
    "Freelancer is unresponsive",
    "Delivery is incomplete",
    "Suspected fraud",
    "Other"
  ];
  await pool.query(
    "INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'dispute_reasons', $1)",
    [JSON.stringify(reasons)]
  );
  console.log("Seeded dispute_reasons setting.");
} else {
  console.log("dispute_reasons setting already exists.");
}
process.exit(0);
