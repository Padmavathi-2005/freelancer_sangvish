import pool from '../config/db.js';

const res = await pool.query('SELECT setting_key, setting_value FROM settings');
console.log(res.rows);
process.exit(0);
