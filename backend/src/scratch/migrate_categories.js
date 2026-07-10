import pool from "../config/db.js";

const DEFAULT_DESCRIPTIONS = {
  "Programming & Tech": "Custom software development, API integrations, web applications, and technical consulting.",
  "Graphics & Design": "Creative logos, branding kits, Figma web layouts, and marketing materials.",
  "Digital Marketing": "SEO audits, Google Ads campaigns, social media management, and growth marketing.",
  "Writing & Translation": "High-converting copy, professional translations, blog content, and editing.",
  "Video & Animation": "Stunning animations, promotional videos, video editing, and motion graphics.",
  "Music & Audio": "Voiceovers, audio editing, theme music, and sound design.",
  "Business": "Business plans, market research, financial projections, and strategic consulting.",
  "Finance & Accounting": "Bookkeeping, tax preparation, payroll, and financial audits.",
  "Data": "Data entry, database design, analytics dashboards, and web scraping.",
  "AI Services": "GPT prompt engineering, custom AI chatbots, machine learning models, and automation scripts.",
  "Photography": "Event photography, product photoshoots, photo editing, and retouching.",
  "Customer Support": "Customer support ticketing, live chat help, email management, and call handling.",
  "Virtual Assistant": "Administrative support, email management, scheduling, and data research.",
  "Engineering": "CAD modeling, PCB design, product prototypes, and mechanical engineering.",
  "Architecture & Interior Design": "Blueprints, 3D architectural renders, interior layouts, and space planning.",
  "Legal Services": "Contract drafting, legal consulting, patent searches, and terms of service.",
  "Sales": "Lead generation, cold calling, sales pipeline setup, and outreach management.",
  "Education & Training": "Online tutoring, language lessons, custom course development, and curriculum design."
};

async function main() {
  try {
    console.log("Running categories table migrations...");
    
    // Add columns
    await pool.query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS description TEXT NULL,
      ADD COLUMN IF NOT EXISTS category_video VARCHAR(255) NULL
    `);
    console.log("✅ Added description and category_video columns successfully.");

    // Seed descriptions
    for (const [name, desc] of Object.entries(DEFAULT_DESCRIPTIONS)) {
      await pool.query(
        "UPDATE categories SET description = $1 WHERE category_name = $2 AND (description IS NULL OR description = '')",
        [desc, name]
      );
    }
    console.log("🌱 Seeded default descriptions successfully.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

main();
