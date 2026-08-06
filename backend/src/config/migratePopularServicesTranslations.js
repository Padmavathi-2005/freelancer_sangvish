import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for popular services landing section translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'top_ranked_services', value: 'Top Ranked Services' },
    { code: 'EN', key: 'popular_services_title', value: 'Popular Services' },
    { code: 'EN', key: 'view_all', value: 'View All' },

    // Arabic (AR)
    { code: 'AR', key: 'top_ranked_services', value: 'الخدمات الأعلى تصنيفًا' },
    { code: 'AR', key: 'popular_services_title', value: 'الخدمات الشائعة' },
    { code: 'AR', key: 'view_all', value: 'عرض الكل' },

    // French (FR)
    { code: 'FR', key: 'top_ranked_services', value: 'Services les mieux classés' },
    { code: 'FR', key: 'popular_services_title', value: 'Services populaires' },
    { code: 'FR', key: 'view_all', value: 'Voir tout' },

    // German (DE)
    { code: 'DE', key: 'top_ranked_services', value: 'Am besten bewertete Services' },
    { code: 'DE', key: 'popular_services_title', value: 'Beliebte Services' },
    { code: 'DE', key: 'view_all', value: 'Alle anzeigen' },

    // Spanish (ES)
    { code: 'ES', key: 'top_ranked_services', value: 'Servicios mejor calificados' },
    { code: 'ES', key: 'popular_services_title', value: 'Servicios populares' },
    { code: 'ES', key: 'view_all', value: 'Ver todo' }
  ];

  try {
    for (const t of translations) {
      await pool.query(
        `INSERT INTO translations (language_code, key, value) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (language_code, key) 
         DO UPDATE SET value = EXCLUDED.value`,
        [t.code.toUpperCase(), t.key.toLowerCase(), t.value]
      );
    }
    console.log("✅ Seeded/Updated Popular Services landing section translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
