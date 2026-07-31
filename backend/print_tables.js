import pool from './src/config/db.js';

async function printTables() {
  for (const t of ['contracts', 'contract_milestones', 'gig_applications', 'gig_application_milestones']) {
    const r = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [t]);
    console.log(`=== ${t} ===`);
    console.table(r.rows);
  }
  await pool.end();
}

printTables().catch(console.error);
