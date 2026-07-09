import fs from 'fs';
import pool from '../config/db.js';

const file = 'g:/freelancer/frontend/src/app/projects/page.tsx';
const keyRegex = /t\(\s*["']([^"']+)["']/g;
const usedKeys = new Set();

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    usedKeys.add(match[1].trim().toLowerCase());
  }
}

async function checkKeys() {
  try {
    const dbRes = await pool.query("SELECT DISTINCT key FROM translations");
    const dbKeys = new Set(dbRes.rows.map(r => r.key.toLowerCase()));

    console.log("=== PROJECTS SEARCH TRANSLATION KEY AUDIT ===");
    console.log(`Total keys found in projects/page.tsx: ${usedKeys.size}`);

    console.log("\n--- Keys used in projects/page.tsx but MISSING in DB: ---");
    const missingInDb = [];
    for (const key of usedKeys) {
      if (!dbKeys.has(key)) {
        missingInDb.push(key);
      }
    }
    console.log(missingInDb);

    if (missingInDb.length === 0) {
      console.log("✅ All keys found in projects/page.tsx are successfully present in the database!");
    } else {
      console.log("❌ Missing keys detected!");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkKeys();
