import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for gigs page translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'saves', value: 'saves' },
    { code: 'EN', key: 'by', value: 'By' },
    { code: 'EN', key: 'delivery', value: 'delivery' },
    { code: 'EN', key: 'starting_at', value: 'Starting At' },

    // Arabic (AR)
    { code: 'AR', key: 'saves', value: 'مرات الحفظ' },
    { code: 'AR', key: 'by', value: 'بواسطة' },
    { code: 'AR', key: 'delivery', value: 'تسليم' },
    { code: 'AR', key: 'starting_at', value: 'يبدأ من' },

    // French (FR)
    { code: 'FR', key: 'saves', value: 'sauvegardes' },
    { code: 'FR', key: 'by', value: 'Par' },
    { code: 'FR', key: 'delivery', value: 'livraison' },
    { code: 'FR', key: 'starting_at', value: 'À partir de' },

    // German (DE)
    { code: 'DE', key: 'saves', value: 'Speicherungen' },
    { code: 'DE', key: 'by', value: 'Von' },
    { code: 'DE', key: 'delivery', value: 'Lieferung' },
    { code: 'DE', key: 'starting_at', value: 'Ab' },

    // Spanish (ES)
    { code: 'ES', key: 'saves', value: 'guardados' },
    { code: 'ES', key: 'by', value: 'Por' },
    { code: 'ES', key: 'delivery', value: 'entrega' },
    { code: 'ES', key: 'starting_at', value: 'A partir de' }
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
    console.log("✅ Seeded/Updated Gigs Page translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
