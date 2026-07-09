import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function main() {
  try {
    // Check constraints on contracts table
    const res = await pool.query(
      `SELECT conname, pg_get_constraintdef(oid) 
       FROM pg_constraint 
       WHERE conrelid = 'contracts'::regclass`
    );
    console.log("Constraints:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
