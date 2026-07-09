import pool from '../config/db.js';

await pool.query(`
  ALTER TABLE contracts 
  ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL;
`);
console.log("Migration complete: Added tracking columns to contracts table.");
process.exit(0);
