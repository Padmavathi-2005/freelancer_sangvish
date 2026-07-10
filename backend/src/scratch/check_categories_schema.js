import pool from "../config/db.js";

async function run() {
  try {
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'categories'
    `);
    console.log("Categories columns:", tableInfo.rows);

    const rows = await pool.query("SELECT * FROM categories LIMIT 5");
    console.log("Sample categories:", rows.rows);
  } catch (err) {
    console.error("Error reading schema:", err);
  } finally {
    await pool.end();
  }
}

run();
