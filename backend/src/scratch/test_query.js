import pool from '../config/db.js';

async function run() {
  try {
    const id = 7;
    const query = `
      SELECT 
        g.*,
        u.first_name || ' ' || u.last_name as freelancer_name,
        u.profile_image as freelancer_image,
        u.email as freelancer_email,
        fp.professional_title as freelancer_title,
        fp.hourly_rate as freelancer_hourly_rate,
        c.code as currency_code,
        c.symbol as currency_symbol,
        c.name as currency_name,
        cat.category_name,
        sub.sub_category_name,
        COALESCE(
          json_agg(
            json_build_object('skill_id', s.skill_id, 'skill_name', s.skill_name)
          ) FILTER (WHERE s.skill_id IS NOT NULL), '[]'::json
        ) as skills
      FROM gigs g
      JOIN users u ON g.freelancer_id = u.user_id
      LEFT JOIN freelancer_profiles fp ON g.freelancer_id = fp.user_id
      LEFT JOIN currencies c ON g.currency_id = c.currency_id
      LEFT JOIN categories cat ON g.category_id = cat.category_id
      LEFT JOIN sub_categories sub ON g.sub_category_id = sub.sub_category_id
      LEFT JOIN gig_skills gs ON g.gig_id = gs.gig_id
      LEFT JOIN skills s ON gs.skill_id = s.skill_id
      WHERE g.gig_id = $1 AND g.status = 'Active'
      GROUP BY g.gig_id, u.user_id, fp.user_id, fp.professional_title, fp.hourly_rate, c.currency_id, c.code, c.symbol, c.name, cat.category_id, cat.category_name, sub.sub_category_id, sub.sub_category_name
    `;
    const result = await pool.query(query, [id]);
    console.log("Rows returned:", result.rows.length);
    if (result.rows.length > 0) {
      console.log("Gig row:", result.rows[0]);
    }
  } catch (e) {
    console.error("Query failed with error:", e);
  } finally {
    process.exit(0);
  }
}

run();
