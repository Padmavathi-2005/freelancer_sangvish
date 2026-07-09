import pool from "../config/db.js";

async function run() {
  try {
    const res = await pool.query("SELECT * FROM users WHERE user_id IN (1, 7)");
    console.log("Users in DB:");
    console.table(res.rows.map(r => ({
      id: r.user_id,
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      role: r.role
    })));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
