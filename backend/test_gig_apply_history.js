import pool from './src/config/db.js';

async function test() {
  try {
    const apps = await pool.query('SELECT * FROM gig_applications ORDER BY created_at DESC LIMIT 5');
    console.log("=== LATEST GIG APPLICATIONS ===");
    console.table(apps.rows);

    const milest = await pool.query('SELECT * FROM gig_application_milestones ORDER BY id DESC LIMIT 5');
    console.log("=== LATEST GIG APPLICATION MILESTONES ===");
    console.table(milest.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
