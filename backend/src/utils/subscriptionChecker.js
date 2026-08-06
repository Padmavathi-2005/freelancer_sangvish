import pool from "../config/db.js";

/**
 * Checks a single user's subscription. If expired, downgrades them to Starter.
 */
export async function checkUserSubscription(userId, io) {
  try {
    const userRes = await pool.query(
      `SELECT u.user_id, u.active_plan_id, u.active_plan_expires_at, sp.plan_role, sp.name as plan_name
       FROM users u
       LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) return;
    const user = userRes.rows[0];

    // If no plan, or free plans (Starter plans are 1 and 5), no need to expire
    if (!user.active_plan_id || user.active_plan_id === 1 || user.active_plan_id === 5) {
      return;
    }

    // Check if expired
    if (user.active_plan_expires_at && new Date(user.active_plan_expires_at) < new Date()) {
      const freePlanId = user.plan_role === "buyer" ? 5 : 1;

      console.log(`[Subscription] Expiring plan for user ${user.user_id} (old plan: ${user.plan_name}). Downgrading to free.`);

      // Update user plan
      await pool.query(
        `UPDATE users SET 
           active_plan_id = $1, 
           active_plan_subscribed_at = CURRENT_TIMESTAMP, 
           active_plan_expires_at = NULL,
           sub_notified_7d = FALSE,
           sub_notified_3d = FALSE,
           sub_notified_1d = FALSE
         WHERE user_id = $2`,
        [freePlanId, user.user_id]
      );

      // Create notification
      const notifTitle = "Membership Plan Expired";
      const notifMsg = `Your ${user.plan_name} subscription has expired. Your account has been reverted to the Free plan.`;
      
      const notifRes = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id)
         VALUES ($1, $2, $3, 'Subscription_Expired', NULL) RETURNING *`,
        [user.user_id, notifTitle, notifMsg]
      );

      // Emit socket notification
      if (io && notifRes.rows.length > 0) {
        io.to(`user_${user.user_id}`).emit("new_notification", notifRes.rows[0]);
      }
    }
  } catch (err) {
    if (err.code !== '42703') {
      console.error(`Error checking subscription for user ${userId}:`, err.message || err);
    }
  }
}

/**
 * Checks all active subscriptions in the database for expiries and sends alert notifications.
 */
export async function checkAllSubscriptions(io) {
  try {
    const now = new Date();
    
    // 1. Process all expiries
    const expiredUsers = await pool.query(
      `SELECT u.user_id, u.active_plan_id, u.active_plan_expires_at, sp.plan_role, sp.name as plan_name
       FROM users u
       JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
       WHERE u.active_plan_expires_at IS NOT NULL 
         AND u.active_plan_expires_at < $1
         AND u.active_plan_id NOT IN (1, 5)`,
      [now]
    );

    for (const user of expiredUsers.rows) {
      const freePlanId = user.plan_role === "buyer" ? 5 : 1;
      
      // Update plan
      await pool.query(
        `UPDATE users SET 
           active_plan_id = $1, 
           active_plan_subscribed_at = CURRENT_TIMESTAMP, 
           active_plan_expires_at = NULL,
           sub_notified_7d = FALSE,
           sub_notified_3d = FALSE,
           sub_notified_1d = FALSE
         WHERE user_id = $2`,
        [freePlanId, user.user_id]
      );

      // Notification
      const notifTitle = "Membership Plan Expired";
      const notifMsg = `Your ${user.plan_name} subscription has expired. Your account has been reverted to the Free plan.`;
      
      const notifRes = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id)
         VALUES ($1, $2, $3, 'Subscription_Expired', NULL) RETURNING *`,
        [user.user_id, notifTitle, notifMsg]
      );

      if (io && notifRes.rows.length > 0) {
        io.to(`user_${user.user_id}`).emit("new_notification", notifRes.rows[0]);
      }
    }

    // 2. Alert notifications before expiration (7 days, 3 days, 1 day)
    const activeUsers = await pool.query(
      `SELECT u.user_id, u.active_plan_id, u.active_plan_expires_at, 
              u.sub_notified_7d, u.sub_notified_3d, u.sub_notified_1d,
              sp.name as plan_name
       FROM users u
       JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
       WHERE u.active_plan_expires_at IS NOT NULL 
         AND u.active_plan_id NOT IN (1, 5)`
    );

    for (const user of activeUsers.rows) {
      const expiresAt = new Date(user.active_plan_expires_at);
      const diffMs = expiresAt - now;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // 1 day notification (diffDays <= 1)
      if (diffDays <= 1 && !user.sub_notified_1d) {
        await pool.query("UPDATE users SET sub_notified_1d = TRUE WHERE user_id = $1", [user.user_id]);
        
        const notifRes = await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_id)
           VALUES ($1, 'Subscription Expiring in 24 Hours', $2, 'Subscription_Alert', NULL) RETURNING *`,
          [user.user_id, `Your ${user.plan_name} subscription will expire in 24 hours. Renew your plan now to keep your benefits uninterrupted.`]
        );
        if (io && notifRes.rows.length > 0) {
          io.to(`user_${user.user_id}`).emit("new_notification", notifRes.rows[0]);
        }
      } 
      // 3 days notification (diffDays <= 3)
      else if (diffDays <= 3 && !user.sub_notified_3d) {
        await pool.query("UPDATE users SET sub_notified_3d = TRUE WHERE user_id = $1", [user.user_id]);
        
        const notifRes = await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_id)
           VALUES ($1, 'Subscription Expiring in 3 Days', $2, 'Subscription_Alert', NULL) RETURNING *`,
          [user.user_id, `Your ${user.plan_name} subscription will expire in 3 days. View your plan options to renew or upgrade.`]
        );
        if (io && notifRes.rows.length > 0) {
          io.to(`user_${user.user_id}`).emit("new_notification", notifRes.rows[0]);
        }
      }
      // 7 days notification (diffDays <= 7)
      else if (diffDays <= 7 && !user.sub_notified_7d) {
        await pool.query("UPDATE users SET sub_notified_7d = TRUE WHERE user_id = $1", [user.user_id]);
        
        const notifRes = await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_id)
           VALUES ($1, 'Subscription Expiring in 7 Days', $2, 'Subscription_Alert', NULL) RETURNING *`,
          [user.user_id, `Your ${user.plan_name} subscription will expire in 7 days. Renew early to avoid credit limitations.`]
        );
        if (io && notifRes.rows.length > 0) {
          io.to(`user_${user.user_id}`).emit("new_notification", notifRes.rows[0]);
        }
      }
    }
  } catch (err) {
    if (err.code !== '42703') {
      console.error("Error in subscription check cron:", err.message || err);
    }
  }
}

/**
 * Runs subscription expiry checker daemon.
 */
export function runSubscriptionDaemon(io) {
  // Run on startup
  setTimeout(() => {
    checkAllSubscriptions(io);
  }, 5000);

  // Run every 1 hour
  setInterval(() => {
    checkAllSubscriptions(io);
  }, 1000 * 60 * 60);
  
  console.log("⏱️ Subscription Checker Daemon started (Checking expiries and alerts hourly).");
}
