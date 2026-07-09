import pool from '../config/db.js';

const res = await pool.query('SELECT contract_id, title, status FROM contracts');
console.log(res.rows);
process.exit(0);
