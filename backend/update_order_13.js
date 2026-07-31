import pool from './src/config/db.js';

async function main() {
  const allMs = [
    { title: 'Primary Gig Scope & Deliverables', amount: '150.00', description: 'Base BASIC Plan Scope' },
    { title: 'Extra Fast 1-Day Delivery', amount: '50.00', description: 'Expedited 1-day turnaround' },
    { title: 'feature 1', amount: '30.00', description: 'Custom requested feature' }
  ];

  await pool.query('UPDATE gig_applications SET milestones = $1 WHERE application_id = 13', [JSON.stringify(allMs)]);
  console.log('✅ Updated gig_applications milestones for Order #13');

  const conRes = await pool.query('SELECT contract_id FROM contracts WHERE application_id = 13');
  if (conRes.rows.length > 0) {
    const cid = conRes.rows[0].contract_id;
    await pool.query('DELETE FROM contract_milestones WHERE contract_id = $1', [cid]);
    for (const m of allMs) {
      await pool.query(
        `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status, description)
         VALUES ($1, $2, $3, 'Pending', 'Funded', $4)`,
        [cid, m.title, m.amount, m.description]
      );
    }
    console.log(`✅ Updated contract_milestones for Contract #${cid}`);
  }
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
