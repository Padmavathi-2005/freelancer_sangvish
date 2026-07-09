import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for CTA section translatable copy...");
  
  const translations = [
    { code: 'EN', key: 'cta_title', value: 'Ready to Hire the Right Freelancer?' },
    { code: 'EN', key: 'cta_subtitle', value: 'Join thousands of businesses who trust Freelancer to deliver exceptional results on time, every time.' },
    { code: 'EN', key: 'cta_btn_primary', value: 'Get Started Now' },
    { code: 'EN', key: 'cta_btn_secondary', value: 'Talk to Sales' },

    { code: 'AR', key: 'cta_title', value: 'هل أنت جاهز لتوظيف المستقل المناسب؟' },
    { code: 'AR', key: 'cta_subtitle', value: 'انضم إلى آلاف الشركات التي تثق بالمنصة لتقديم نتائج استثنائية في الوقت المحدد، في كل مرة.' },
    { code: 'AR', key: 'cta_btn_primary', value: 'ابدأ الآن' },
    { code: 'AR', key: 'cta_btn_secondary', value: 'تحدث مع المبيعات' },

    { code: 'FR', key: 'cta_title', value: 'Prêt à embaucher le bon freelance ?' },
    { code: 'FR', key: 'cta_subtitle', value: 'Rejoignez des milliers d\'entreprises qui font confiance à Freelancer pour obtenir des résultats exceptionnels, à temps, à chaque fois.' },
    { code: 'FR', key: 'cta_btn_primary', value: 'Commencer maintenant' },
    { code: 'FR', key: 'cta_btn_secondary', value: 'Contacter le service commercial' },

    { code: 'DE', key: 'cta_title', value: 'Bereit, den richtigen Freelancer einzustellen?' },
    { code: 'DE', key: 'cta_subtitle', value: 'Schließen Sie sich Tausenden von Unternehmen an, die auf Freelancer vertrauen, um jederzeit pünktlich außergewöhnliche Ergebnisse zu erzielen.' },
    { code: 'DE', key: 'cta_btn_primary', value: 'Jetzt loslegen' },
    { code: 'DE', key: 'cta_btn_secondary', value: 'Mit dem Vertrieb sprechen' }
  ];

  try {
    for (const t of translations) {
      await pool.query(
        `INSERT INTO translations (language_code, key, value) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (language_code, key) 
         DO UPDATE SET value = EXCLUDED.value`,
        [t.code, t.key, t.value]
      );
    }
    console.log("✅ Seeded/Updated CTA translatable sections successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
