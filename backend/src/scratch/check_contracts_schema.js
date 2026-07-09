import pool from '../config/db.js';

const res = await pool.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'contracts'
`);
console.log(res.rows);
process.exit(0);
