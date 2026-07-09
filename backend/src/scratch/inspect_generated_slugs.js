import pool from '../config/db.js';

async function run() {
  try {
    const users = await pool.query("SELECT user_id, first_name, last_name, slug FROM users");
    console.log("=== USERS SLUGS ===");
    console.table(users.rows);

    const gigs = await pool.query("SELECT gig_id, title, slug FROM gigs");
    console.log("=== GIGS SLUGS ===");
    console.table(gigs.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
