import pool from "./src/config/db.js";

async function checkDb() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Existing Tables:");
    console.log(res.rows.map(r => r.table_name));

    // For each table, get columns
    for (const row of res.rows) {
      const tableName = row.table_name;
      const colsRes = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
      `, [tableName]);
      console.log(`\nTable: ${tableName}`);
      console.table(colsRes.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkDb();
