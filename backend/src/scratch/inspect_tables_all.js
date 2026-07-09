import pool from '../config/db.js';

async function run() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log("=== TABLES IN DATABASE ===");
    console.log(res.rows.map(r => r.table_name));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
