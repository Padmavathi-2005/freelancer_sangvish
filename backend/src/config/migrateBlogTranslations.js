import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for site-name dynamic blog translations...");

  const translations = [
    // EN
    { code: 'EN', key: 'blog_hero_pill', value: '{{siteName}} Publications' },
    // FR
    { code: 'FR', key: 'blog_hero_pill', value: 'Publications {{siteName}}' },
    // ES
    { code: 'ES', key: 'blog_hero_pill', value: 'Publicaciones {{siteName}}' },
    // DE
    { code: 'DE', key: 'blog_hero_pill', value: '{{siteName}}-Publikationen' },
    // AR
    { code: 'AR', key: 'blog_hero_pill', value: 'منشورات {{siteName}}' }
  ];

  for (const item of translations) {
    await pool.query(
      `INSERT INTO translations (language_code, key, value, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (language_code, key) 
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [item.code, item.key, item.value]
    );
  }

  console.log("🎉 Successfully updated site_name dynamic blog translations in PostgreSQL!");
  pool.end();
}

run().catch((err) => {
  console.error("Migration error:", err);
  pool.end();
});
