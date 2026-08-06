import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for proposals prefixes translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'client_prefix', value: 'Client:' },
    { code: 'EN', key: 'offer_date_prefix', value: 'Offer Date:' },

    // Arabic (AR)
    { code: 'AR', key: 'client_prefix', value: 'العميل:' },
    { code: 'AR', key: 'offer_date_prefix', value: 'تاريخ العرض:' },

    // French (FR)
    { code: 'FR', key: 'client_prefix', value: 'Client :' },
    { code: 'FR', key: 'offer_date_prefix', value: 'Date de l\'offre :' },

    // German (DE)
    { code: 'DE', key: 'client_prefix', value: 'Kunde:' },
    { code: 'DE', key: 'offer_date_prefix', value: 'Angebotsdatum:' },

    // Spanish (ES)
    { code: 'ES', key: 'client_prefix', value: 'Cliente:' },
    { code: 'ES', key: 'offer_date_prefix', value: 'Fecha de la oferta:' }
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
    console.log("✅ Seeded/Updated Proposals prefixes translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
