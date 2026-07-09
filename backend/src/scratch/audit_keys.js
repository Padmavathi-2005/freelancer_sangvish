import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';

const componentsDir = 'g:/freelancer/frontend/src/components';
const appDir = 'g:/freelancer/frontend/src/app';

const componentFiles = [
  'Header.tsx',
  'Hero.tsx',
  'Categories.tsx',
  'FeaturedFreelancers.tsx',
  'PopularServices.tsx',
  'RecentProjects.tsx',
  'Pricing.tsx',
  'WhyChoose.tsx',
  'HowItWorks.tsx',
  'SuccessStories.tsx',
  'FAQ.tsx',
  'CTA.tsx',
  'Footer.tsx'
].map(f => path.join(componentsDir, f));

// Add app pages that might have landing page content
componentFiles.push(path.join(appDir, 'page.tsx'));

const keyRegex = /t\(\s*["']([^"']+)["']/g;
const usedKeys = new Set();

for (const file of componentFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      usedKeys.add(match[1].trim().toLowerCase());
    }
  }
}

async function checkKeys() {
  try {
    const dbRes = await pool.query("SELECT DISTINCT key FROM translations");
    const dbKeys = new Set(dbRes.rows.map(r => r.key.toLowerCase()));

    console.log("=== TRANSLATION KEY AUDIT ===");
    console.log(`Total keys found in frontend components: ${usedKeys.size}`);
    console.log(`Total keys found in DB translations table: ${dbKeys.size}`);

    console.log("\n--- Keys used in frontend but MISSING in DB translations: ---");
    const missingInDb = [];
    for (const key of usedKeys) {
      if (!dbKeys.has(key)) {
        missingInDb.push(key);
      }
    }
    console.log(missingInDb);

    console.log("\n--- Keys in DB but NOT used directly in frontend landing components: ---");
    const unusedInFrontend = [];
    for (const key of dbKeys) {
      if (!usedKeys.has(key)) {
        unusedInFrontend.push(key);
      }
    }
    console.log(unusedInFrontend);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkKeys();
