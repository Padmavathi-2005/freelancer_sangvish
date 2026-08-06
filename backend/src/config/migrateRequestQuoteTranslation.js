import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for request quote key...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'request_quote', value: 'Request Quote' },

    // Arabic (AR)
    { code: 'AR', key: 'request_quote', value: 'طلب عرض سعر' },

    // French (FR)
    { code: 'FR', key: 'request_quote', value: 'Demander un devis' },

    // German (DE)
    { code: 'DE', key: 'request_quote', value: 'Angebot anfordern' },

    // Spanish (ES)
    { code: 'ES', key: 'request_quote', value: 'Solicitar cotización' }
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
    console.log("✅ Seeded/Updated request quote translation successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
