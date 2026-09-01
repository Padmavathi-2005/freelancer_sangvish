import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Admin Taxonomies extra header & tab translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_taxonomies_languages_currencies', value: 'Taxonomies, Languages & Currencies' },
    { code: 'EN', key: 'admin_taxonomies_languages_currencies_desc', value: 'Configure supported site languages, dictionary translation keys, and platform currencies.' },
    { code: 'EN', key: 'language', value: 'Language' },
    { code: 'EN', key: 'currency', value: 'Currency' },
    { code: 'EN', key: 'admin_categories_skills_management', value: 'Categories & Skills Management' },
    { code: 'EN', key: 'admin_categories_skills_management_desc', value: 'Configure developer categories, nested subcategories, and searchable technical skills.' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_taxonomies_languages_currencies', value: 'التصنيفات، اللغات والعملات' },
    { code: 'AR', key: 'admin_taxonomies_languages_currencies_desc', value: 'تكوين لغات الموقع المدعومة، ومفاتيح ترجمة القاموس، وعملات المنصة.' },
    { code: 'AR', key: 'language', value: 'اللغة' },
    { code: 'AR', key: 'currency', value: 'العملة' },
    { code: 'AR', key: 'admin_categories_skills_management', value: 'إدارة التصنيفات والمهارات' },
    { code: 'AR', key: 'admin_categories_skills_management_desc', value: 'تكوين فئات المطورين، والفئات الفرعية المتداخلة، والمهارات التقنية القابلة للبحث.' }
  ];

  let insertedCount = 0;
  for (const item of translations) {
    await pool.query(
      `INSERT INTO translations (language_code, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (language_code, key)
       DO UPDATE SET value = EXCLUDED.value`,
      [item.code, item.key, item.value]
    );
    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} extra header & tab translations.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
