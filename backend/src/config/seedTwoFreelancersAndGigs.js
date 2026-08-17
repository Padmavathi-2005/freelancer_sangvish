import pool from "./db.js";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Starting complete seed script for 2 fully verified & admin-approved freelancers with gigs...");

  try {
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // 1. Categories lookup
    const catRes = await pool.query("SELECT category_id, category_name FROM categories");
    const categoriesMap = {};
    catRes.rows.forEach((r) => {
      categoriesMap[r.category_name] = r.category_id;
    });

    const progTechCatId = categoriesMap["Programming & Tech"] || 1;
    const graphicsDesignCatId = categoriesMap["Graphics & Design"] || 2;
    const aiCatId = categoriesMap["AI Services"] || 10;

    // Sub-categories lookup
    const subCatRes = await pool.query("SELECT sub_category_id, sub_category_name FROM sub_categories");
    const subCatMap = {};
    subCatRes.rows.forEach((r) => {
      subCatMap[r.sub_category_name] = r.sub_category_id;
    });

    const webDevSubId = subCatMap["Web Development"] || 1;
    const fullStackSubId = subCatMap["Full Stack Development"] || 5;
    const uiSubId = subCatMap["UI Design"] || 18;
    const webDesignSubId = subCatMap["Web Design"] || 20;

    // --- FREELANCER 1: Elena Rostova ---
    const user1Res = await pool.query(
      `INSERT INTO users (
        first_name, last_name, display_name, email, phone, password_hash, profile_image, tagline, description, country, city, is_verified, is_active, email_verified, phone_verified, slug, referral_code
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (email) DO UPDATE SET 
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         display_name = EXCLUDED.display_name,
         phone = EXCLUDED.phone,
         profile_image = EXCLUDED.profile_image,
         tagline = EXCLUDED.tagline,
         description = EXCLUDED.description,
         country = EXCLUDED.country,
         city = EXCLUDED.city,
         is_verified = true,
         is_active = true,
         email_verified = true,
         phone_verified = true
       RETURNING user_id`,
      [
        "Elena",
        "Rostova",
        "Elena Rostova",
        "elena.rostova@freelancer.com",
        "+14155550198",
        hashedPassword,
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
        "Senior Full Stack & AI Agent Specialist",
        "10+ years of engineering experience with Next.js 14, Python, LangChain, OpenAI, and GraphQL. I build scalable, high-performance web applications and intelligent autonomous agents for enterprise clients.",
        "United States",
        "San Francisco",
        true,
        true,
        true,
        true,
        "elena-rostova",
        "REF-ELENA-101"
      ]
    );
    const user1Id = user1Res.rows[0].user_id;

    await pool.query(
      `INSERT INTO freelancer_profiles (
        user_id, category_id, sub_category_id, professional_title, experience_level, total_experience_years, hourly_rate, availability_status, linkedin_url, portfolio_website, onboarding_completed, current_step, vetting_status, bio
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (user_id) DO UPDATE SET
         professional_title = EXCLUDED.professional_title,
         experience_level = EXCLUDED.experience_level,
         total_experience_years = EXCLUDED.total_experience_years,
         hourly_rate = EXCLUDED.hourly_rate,
         availability_status = EXCLUDED.availability_status,
         linkedin_url = EXCLUDED.linkedin_url,
         portfolio_website = EXCLUDED.portfolio_website,
         onboarding_completed = true,
         current_step = 4,
         vetting_status = 'Approved',
         bio = EXCLUDED.bio`,
      [
        user1Id,
        progTechCatId,
        fullStackSubId,
        "Senior Full Stack & AI Agent Developer",
        "Expert",
        8,
        85.00,
        "Available",
        "https://linkedin.com/in/elena-rostova-tech",
        "https://elena-rostova.dev",
        true,
        4,
        "Approved",
        "10+ years of engineering experience with Next.js 14, Python, LangChain, OpenAI, and GraphQL. I build scalable, high-performance web applications and intelligent autonomous agents for enterprise clients."
      ]
    );

    console.log(`✅ Freelancer 1 Fully Verified & Approved: Elena Rostova (user_id: ${user1Id})`);

    // --- FREELANCER 2: Marcus Vance ---
    const user2Res = await pool.query(
      `INSERT INTO users (
        first_name, last_name, display_name, email, phone, password_hash, profile_image, tagline, description, country, city, is_verified, is_active, email_verified, phone_verified, slug, referral_code
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (email) DO UPDATE SET 
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         display_name = EXCLUDED.display_name,
         phone = EXCLUDED.phone,
         profile_image = EXCLUDED.profile_image,
         tagline = EXCLUDED.tagline,
         description = EXCLUDED.description,
         country = EXCLUDED.country,
         city = EXCLUDED.city,
         is_verified = true,
         is_active = true,
         email_verified = true,
         phone_verified = true
       RETURNING user_id`,
      [
        "Marcus",
        "Vance",
        "Marcus Vance",
        "marcus.vance@freelancer.com",
        "+12125550144",
        hashedPassword,
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=80",
        "Lead UI/UX Product Designer & Brand Strategist",
        "Award-winning Figma UI/UX Lead specializing in SaaS dashboards, conversion-focused landing pages, complex design systems, and responsive web & mobile app interfaces.",
        "United States",
        "New York",
        true,
        true,
        true,
        true,
        "marcus-vance",
        "REF-MARCUS-102"
      ]
    );
    const user2Id = user2Res.rows[0].user_id;

    await pool.query(
      `INSERT INTO freelancer_profiles (
        user_id, category_id, sub_category_id, professional_title, experience_level, total_experience_years, hourly_rate, availability_status, linkedin_url, portfolio_website, onboarding_completed, current_step, vetting_status, bio
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (user_id) DO UPDATE SET
         professional_title = EXCLUDED.professional_title,
         experience_level = EXCLUDED.experience_level,
         total_experience_years = EXCLUDED.total_experience_years,
         hourly_rate = EXCLUDED.hourly_rate,
         availability_status = EXCLUDED.availability_status,
         linkedin_url = EXCLUDED.linkedin_url,
         portfolio_website = EXCLUDED.portfolio_website,
         onboarding_completed = true,
         current_step = 4,
         vetting_status = 'Approved',
         bio = EXCLUDED.bio`,
      [
        user2Id,
        graphicsDesignCatId,
        uiSubId,
        "Lead UI/UX Designer & Brand Strategist",
        "Expert",
        7,
        75.00,
        "Available",
        "https://linkedin.com/in/marcus-vance-design",
        "https://marcusvance.design",
        true,
        4,
        "Approved",
        "Award-winning Figma UI/UX Lead specializing in SaaS dashboards, conversion-focused landing pages, complex design systems, and responsive web & mobile app interfaces."
      ]
    );

    console.log(`✅ Freelancer 2 Fully Verified & Approved: Marcus Vance (user_id: ${user2Id})`);

    // --- GIGS FOR ELENA ROSTOVA ---
    const gig1 = await pool.query(
      `INSERT INTO gigs (freelancer_id, category_id, sub_category_id, title, description, price, delivery_days, revisions, images, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING gig_id`,
      [
        user1Id,
        aiCatId,
        webDevSubId,
        "Build Custom AI Chatbot & Agent System with Next.js & OpenAI API",
        "I will build an intelligent custom AI chatbot or autonomous AI agent system tailored for your web platform. Features RAG vector database integration, OpenAI API, streaming responses, and seamless React frontend UI.",
        450.00,
        3,
        5,
        JSON.stringify(["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"]),
        "Active"
      ]
    );

    const gig2 = await pool.query(
      `INSERT INTO gigs (freelancer_id, category_id, sub_category_id, title, description, price, delivery_days, revisions, images, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING gig_id`,
      [
        user1Id,
        progTechCatId,
        fullStackSubId,
        "Enterprise Next.js 14 Full Stack Web App & API Development",
        "Production-grade web application engineering using Next.js 14 App Router, Tailwind CSS, TypeScript, PostgreSQL, and Express API. Ultra-fast performance and clean scalable code standards.",
        750.00,
        5,
        10,
        JSON.stringify(["https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"]),
        "Active"
      ]
    );

    // --- GIGS FOR MARCUS VANCE ---
    const gig3 = await pool.query(
      `INSERT INTO gigs (freelancer_id, category_id, sub_category_id, title, description, price, delivery_days, revisions, images, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING gig_id`,
      [
        user2Id,
        graphicsDesignCatId,
        webDesignSubId,
        "High-Converting Figma UI/UX Landing Page & SaaS Web Design",
        "Custom pixel-perfect Figma UI/UX design for landing pages and web dashboards. Modern aesthetics, glassmorphism, responsive grid layout, and developer-ready component handoff.",
        350.00,
        2,
        4,
        JSON.stringify(["https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80"]),
        "Active"
      ]
    );

    const gig4 = await pool.query(
      `INSERT INTO gigs (freelancer_id, category_id, sub_category_id, title, description, price, delivery_days, revisions, images, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING gig_id`,
      [
        user2Id,
        graphicsDesignCatId,
        uiSubId,
        "Complete Brand Identity System & Figma Component Library",
        "Includes primary & secondary logos, typography system, custom color palette, brand guidelines book, and reusable UI component library in Figma.",
        500.00,
        4,
        6,
        JSON.stringify(["https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&auto=format&fit=crop&q=80"]),
        "Active"
      ]
    );

    console.log(`✅ Seeded 4 new Active Gigs: IDs [${gig1.rows[0].gig_id}, ${gig2.rows[0].gig_id}, ${gig3.rows[0].gig_id}, ${gig4.rows[0].gig_id}]`);

    console.log("🎉 Successfully seeded 2 fully verified, onboarded & admin-approved freelancers with 4 active gigs!");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    pool.end();
  }
}

seed();
