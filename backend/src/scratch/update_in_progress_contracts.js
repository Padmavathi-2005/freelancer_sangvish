import pool from '../config/db.js';

// Update work_started_at for in-progress or further contracts to match created_at (as fallback)
await pool.query(`
  UPDATE contracts 
  SET work_started_at = created_at 
  WHERE work_started_at IS NULL 
    AND status IN ('Work Started', 'Under Review', 'Completed', 'Disputed');
`);

// Update submitted_at for review or completed contracts
await pool.query(`
  UPDATE contracts 
  SET submitted_at = updated_at 
  WHERE submitted_at IS NULL 
    AND status IN ('Under Review', 'Completed');
`);

// Update completed_at for completed contracts
await pool.query(`
  UPDATE contracts 
  SET completed_at = updated_at 
  WHERE completed_at IS NULL 
    AND status = 'Completed';
`);

// Update disputed_at for disputed contracts
await pool.query(`
  UPDATE contracts 
  SET disputed_at = updated_at 
  WHERE disputed_at IS NULL 
    AND status = 'Disputed';
`);

// Update cancelled_at for cancelled contracts
await pool.query(`
  UPDATE contracts 
  SET cancelled_at = updated_at 
  WHERE cancelled_at IS NULL 
    AND status = 'Cancelled';
`);

console.log("Seeded backfilled dates for existing demo contracts successfully.");
process.exit(0);
