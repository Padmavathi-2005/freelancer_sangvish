import pool from '../config/db.js';

async function run() {
  try {
    const users = await pool.query(
      `SELECT u.user_id, u.email, u.active_plan_id, sp.name as plan_name, sp.credits, u.created_at
       FROM users u
       LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
       ORDER BY u.user_id DESC
       LIMIT 5`
    );
    console.log("=== LATEST USERS & ACTIVE PLANS ===");
    console.log(users.rows);

    for (const user of users.rows) {
      // Calculate dynamic cycle start
      const regDate = new Date(user.created_at);
      const now = new Date();
      const diffTime = now.getTime() - regDate.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffDays = Math.floor(diffTime / oneDayMs);
      const durationDays = 30; // assume default 30
      const completedCycles = Math.floor(diffDays / durationDays);
      const cycleStart = new Date(regDate.getTime() + completedCycles * durationDays * oneDayMs);

      const countRes = await pool.query(
        `SELECT COUNT(*) FROM proposals 
         WHERE freelancer_id = $1 
           AND created_at >= $2`,
        [user.user_id, cycleStart]
      );
      console.log(`User ID: ${user.user_id} (${user.email}) | Cycle Start: ${cycleStart.toISOString()}`);
      console.log(`Proposals in current cycle: ${countRes.rows[0].count} / Limit (Credits): ${user.credits || 10}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
