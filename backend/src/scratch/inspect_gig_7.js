import pool from '../config/db.js';

async function run() {
  try {
    const gigRes = await pool.query("SELECT * FROM gigs WHERE gig_id = 7");
    if (gigRes.rows.length === 0) {
      console.log("Gig 7 not found in database.");
      process.exit(0);
    }
    const gig = gigRes.rows[0];
    console.log("=== GIG 7 DETAILS ===");
    console.log(gig);

    const userRes = await pool.query("SELECT * FROM users WHERE user_id = $1", [gig.freelancer_id]);
    console.log("\n=== FREELANCER DETAILS ===");
    console.log(userRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
