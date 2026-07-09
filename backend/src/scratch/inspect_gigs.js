import pool from '../config/db.js';

async function run() {
  try {
    const res = await pool.query("SELECT gig_id, title, status FROM gigs");
    console.log("=== GIGS IN DATABASE ===");
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
