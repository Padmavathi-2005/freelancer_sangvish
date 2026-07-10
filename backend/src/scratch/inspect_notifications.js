import pool from '../config/db.js';

async function run() {
  try {
    const result = await pool.query("SELECT * FROM notifications ORDER BY notification_id DESC LIMIT 5");
    console.log("=== LATEST NOTIFICATIONS ===");
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
