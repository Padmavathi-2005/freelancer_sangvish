import pool from "../config/db.js";

async function run() {
  try {
    const jobsRes = await pool.query("SELECT job_id, title, status, client_id, is_featured, created_at FROM jobs");
    console.log("All jobs in database:", jobsRes.rows);
    
    const countOpen = await pool.query("SELECT COUNT(*) FROM jobs WHERE status = 'Open'");
    console.log("Count of Open status jobs:", countOpen.rows[0].count);
  } catch (err) {
    console.error("Error reading jobs:", err);
  } finally {
    await pool.end();
  }
}

run();
