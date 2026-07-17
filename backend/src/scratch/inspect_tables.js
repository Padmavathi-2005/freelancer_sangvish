import pool from '../config/db.js';

async function main() {
  try {
    const contractsCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contracts'
    `);
    console.log("contracts columns:", contractsCols.rows.map(r => r.column_name));

    const proposalsCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'proposals'
    `);
    console.log("proposals columns:", proposalsCols.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
