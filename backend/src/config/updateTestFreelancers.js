import pool from "./db.js";

async function updateTestUsers() {
  console.log("🚀 Updating User ID 1 and User ID 3 with complete professional profiles & verification...");

  try {
    // 1. Update User ID 1 (Sophia Chen)
    await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           display_name = $3,
           slug = $4,
           phone = $5,
           country = $6,
           city = $7,
           tagline = $8,
           description = $9,
           profile_image = $10,
           is_verified = true,
           is_active = true,
           email_verified = true,
           phone_verified = true
       WHERE user_id = 1`,
      [
        "Sophia",
        "Chen",
        "Sophia Chen",
        "sophia-chen",
        "+14155550199",
        "United States",
        "Austin",
        "Lead Full Stack Laravel & React Architect",
        "Senior Full Stack Developer with 7+ years of experience crafting high-performance Laravel APIs, Next.js web applications, and database architectures.",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
      ]
    );

    await pool.query(
      `UPDATE freelancer_profiles
       SET professional_title = $1,
           bio = $2,
           experience_level = $3,
           total_experience_years = $4,
           hourly_rate = $5,
           availability_status = $6,
           onboarding_completed = true,
           current_step = 4,
           vetting_status = 'Approved'
       WHERE user_id = 1`,
      [
        "Lead Full Stack Laravel & React Architect",
        "Senior Full Stack Developer with 7+ years of experience crafting high-performance Laravel APIs, Next.js web applications, and database architectures for tech startups.",
        "Expert",
        7,
        65.00,
        "Available"
      ]
    );

    console.log("✅ User ID 1 updated: Sophia Chen (Lead Full Stack Developer)");

    // 2. Update User ID 3 (Lucas Miller)
    await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           display_name = $3,
           slug = $4,
           phone = $5,
           country = $6,
           city = $7,
           tagline = $8,
           description = $9,
           profile_image = $10,
           is_verified = true,
           is_active = true,
           email_verified = true,
           phone_verified = true
       WHERE user_id = 3`,
      [
        "Lucas",
        "Miller",
        "Lucas Miller",
        "lucas-miller",
        "+14155550177",
        "United States",
        "Seattle",
        "Senior Frontend React & Web UI Engineer",
        "Creative Senior Frontend Engineer specializing in React, Next.js, Tailwind CSS, TypeScript, and responsive Web UI component engineering.",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80"
      ]
    );

    await pool.query(
      `UPDATE freelancer_profiles
       SET professional_title = $1,
           bio = $2,
           experience_level = $3,
           total_experience_years = $4,
           hourly_rate = $5,
           availability_status = $6,
           onboarding_completed = true,
           current_step = 4,
           vetting_status = 'Approved'
       WHERE user_id = 3`,
      [
        "Senior Frontend React & Web UI Engineer",
        "Creative Senior Frontend Engineer specializing in React, Next.js, Tailwind CSS, TypeScript, and responsive Web UI component engineering.",
        "Expert",
        6,
        58.00,
        "Available"
      ]
    );

    console.log("✅ User ID 3 updated: Lucas Miller (Senior Frontend Engineer)");

    console.log("🎉 Successfully updated test freelancer profiles to clean, authentic, verified & approved profiles!");
  } catch (err) {
    console.error("❌ Update failed:", err);
  } finally {
    pool.end();
  }
}

updateTestUsers();
