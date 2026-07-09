import pool from '../config/db.js';

// Replicate model calls to see what fails
async function run() {
  try {
    const userId = 7;

    // 1. users
    const userRes = await pool.query(
        "SELECT first_name || ' ' || last_name as name, email, profile_image FROM users WHERE user_id = $1",
        [userId]
    );
    console.log("User:", userRes.rows);

    // 2. FreelancerProfile.findByUserId
    console.log("Checking freelancer_profiles...");
    const profileRes = await pool.query("SELECT * FROM freelancer_profiles WHERE user_id = $1", [userId]);
    console.log("Profile:", profileRes.rows);

    // 3. Experience.getByUserId
    console.log("Checking experiences...");
    const experienceRes = await pool.query("SELECT * FROM education WHERE user_id = $1", [userId]); // Let's check table name or class
    
  } catch (e) {
    console.error("Failed:", e);
  } finally {
    process.exit(0);
  }
}

run();
