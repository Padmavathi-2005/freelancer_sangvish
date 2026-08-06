import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for home landing page translations...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'featured_label', value: 'Top Talent' },
    { code: 'EN', key: 'featured_title', value: 'Featured Freelancers' },
    { code: 'EN', key: 'featured_subtitle', value: 'Top-rated professionals ready to start immediately.' },
    { code: 'EN', key: 'featured_btn', value: 'See all' },
    { code: 'EN', key: 'btn_hire_now', value: 'Hire Now' },

    // Arabic (AR)
    { code: 'AR', key: 'featured_label', value: 'مستقلون مميزون' },
    { code: 'AR', key: 'featured_title', value: 'مستقلون مميزون' },
    { code: 'AR', key: 'featured_subtitle', value: 'محترفون ذوو تقييم عالٍ مستعدون للبدء فوراً.' },
    { code: 'AR', key: 'featured_btn', value: 'عرض الكل' },
    { code: 'AR', key: 'btn_hire_now', value: 'وظف الآن' },

    // French (FR)
    { code: 'FR', key: 'featured_label', value: 'Meilleurs Talents' },
    { code: 'FR', key: 'featured_title', value: 'Freelances en vedette' },
    { code: 'FR', key: 'featured_subtitle', value: 'Professionnels les mieux notés prêts à commencer immédiatement.' },
    { code: 'FR', key: 'featured_btn', value: 'Voir tout' },
    { code: 'FR', key: 'btn_hire_now', value: 'Embaucher maintenant' },

    // German (DE)
    { code: 'DE', key: 'featured_label', value: 'Spitzentalente' },
    { code: 'DE', key: 'featured_title', value: 'Hervorgehobene Freelancer' },
    { code: 'DE', key: 'featured_subtitle', value: 'Erstklassige Profis, die sofort einsatzbereit sind.' },
    { code: 'DE', key: 'featured_btn', value: 'Alle anzeigen' },
    { code: 'DE', key: 'btn_hire_now', value: 'Jetzt einstellen' },

    // Spanish (ES)
    { code: 'ES', key: 'featured_label', value: 'Mejores Talentos' },
    { code: 'ES', key: 'featured_title', value: 'Freelancers destacados' },
    { code: 'ES', key: 'featured_subtitle', value: 'Profesionales de primer nivel listos para comenzar de inmediato.' },
    { code: 'ES', key: 'featured_btn', value: 'Ver todo' },
    { code: 'ES', key: 'btn_hire_now', value: 'Contratar ahora' }
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
    console.log("✅ Seeded/Updated home landing page translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
