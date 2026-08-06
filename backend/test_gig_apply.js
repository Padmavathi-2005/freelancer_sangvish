import pool from './src/config/db.js';
import Gig from './src/models/gigModel.js';

async function test() {
  try {
    const gigRes = await pool.query('SELECT gig_id FROM gigs LIMIT 1');
    const gigId = gigRes.rows[0].gig_id;
    const clientRes = await pool.query('SELECT user_id FROM users LIMIT 1');
    const clientId = clientRes.rows[0].user_id;

    // EXACT values as from frontend when date inputs are empty strings
    const milestones = [{ title: "Milestone 1", amount: "10000", start_date: "", end_date: "", description: "se" }];
    
    console.log("Calling Gig.createApplication...");
    const app = await Gig.createApplication(gigId, clientId, "Test requirements details", 10000, null, milestones);
    console.log("Success! Created application, now inserting milestones...");

    for (const m of milestones) {
      await pool.query(
        `INSERT INTO gig_application_milestones (application_id, title, description, amount, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          app.application_id,
          m.title,
          m.description || null,
          parseFloat(m.amount || 0),
          m.start_date || null,
          m.end_date || null
        ]
      );
    }
    console.log("Success! Milestones inserted successfully.");

  } catch (err) {
    console.error("Error thrown during test:", err);
  } finally {
    await pool.end();
  }
}

test();
