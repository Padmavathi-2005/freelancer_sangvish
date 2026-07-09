import pool from "../config/db.js";

async function analyzeTranslations() {
  try {
    // 1. Get all active languages
    const langRes = await pool.query("SELECT * FROM languages WHERE status = 'Active'");
    console.log("=== ACTIVE LANGUAGES IN DATABASE ===");
    console.table(langRes.rows);

    // 2. Get translation keys count per language
    const countRes = await pool.query(`
      SELECT language_code, COUNT(*), COUNT(CASE WHEN value IS NULL OR value = '' THEN 1 END) as empty_count
      FROM translations
      GROUP BY language_code
    `);
    console.log("\n=== TRANSLATION COUNTS BY LANGUAGE ===");
    console.table(countRes.rows);

    // 3. Get all translation keys and their values for each active language
    const transRes = await pool.query(`
      SELECT key, language_code, value 
      FROM translations 
      ORDER BY key, language_code
    `);
    
    // Group by key
    const keysMap = {};
    for (const row of transRes.rows) {
      if (!keysMap[row.key]) {
        keysMap[row.key] = {};
      }
      keysMap[row.key][row.language_code] = row.value;
    }

    console.log(`\n=== TOTAL TRANSLATION KEYS FOUND: ${Object.keys(keysMap).length} ===`);
    console.log("Keys in DB:");
    console.log(JSON.stringify(Object.keys(keysMap), null, 2));

  } catch (err) {
    console.error("Error analyzing translations:", err);
  } finally {
    await pool.end();
  }
}

analyzeTranslations();
