import pool from "./db.js";

async function testGetUsers() {
  try {
    const query = `
      SELECT 
        u.user_id, u.first_name, u.last_name, u.display_name, u.email, u.phone, u.profile_image, u.country, u.state, u.city, u.address, u.pincode, u.tagline, u.description, u.is_active, u.is_verified, u.email_verified, u.phone_verified, u.created_at,
        cp.company_name, cp.company_website AS client_website, cp.industry, cp.onboarding_completed AS client_onboarding,
        fp.professional_title, fp.hourly_rate, fp.experience_level, fp.total_experience_years, fp.bio, fp.linkedin_url, fp.portfolio_website, fp.resume_url, fp.onboarding_completed AS freelancer_onboarding,
        COALESCE(fp.vetting_status, cp.vetting_status) AS vetting_status,
        (
          SELECT COALESCE(json_agg(e.*), '[]'::json)
          FROM education e
          WHERE e.user_id = u.user_id
        ) AS education_details
      FROM users u
      LEFT JOIN client_profiles cp ON u.user_id = cp.user_id
      LEFT JOIN freelancer_profiles fp ON u.user_id = fp.user_id
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query);
    console.log("🎉 SUCCESS! Returned rows count:", result.rows.length);
    console.log("Sample user:", result.rows[0]);
  } catch (err) {
    console.error("❌ ERROR in getUsers query:", err);
  } finally {
    pool.end();
  }
}

testGetUsers();
