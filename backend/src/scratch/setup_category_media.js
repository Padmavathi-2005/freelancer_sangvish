import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES_MAPPING = {
  "Programming & Tech": {
    key: "programming_tech",
    url: "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=400&auto=format&fit=crop"
  },
  "Graphics & Design": {
    key: "graphics_design",
    url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=400&auto=format&fit=crop"
  },
  "Digital Marketing": {
    key: "digital_marketing",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop"
  },
  "Writing & Translation": {
    key: "writing_translation",
    url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400&auto=format&fit=crop"
  },
  "Video & Animation": {
    key: "video_animation",
    url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=400&auto=format&fit=crop"
  },
  "Music & Audio": {
    key: "music_audio",
    url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop"
  },
  "Business": {
    key: "business",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop"
  },
  "Finance & Accounting": {
    key: "finance_accounting",
    url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop"
  },
  "Data": {
    key: "data",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop"
  },
  "AI Services": {
    key: "ai_services",
    url: "https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=400&auto=format&fit=crop"
  },
  "Photography": {
    key: "photography",
    url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=400&auto=format&fit=crop"
  },
  "Customer Support": {
    key: "customer_support",
    url: "https://images.unsplash.com/photo-1521791136368-1a46827d0af1?q=80&w=400&auto=format&fit=crop"
  },
  "Virtual Assistant": {
    key: "virtual_assistant",
    url: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=400&auto=format&fit=crop"
  },
  "Engineering": {
    key: "engineering",
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop"
  },
  "Architecture & Interior Design": {
    key: "architecture_interior",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop"
  },
  "Legal Services": {
    key: "legal_services",
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop"
  },
  "Sales": {
    key: "sales",
    url: "https://images.unsplash.com/photo-1552581230-c0137413876d?q=80&w=400&auto=format&fit=crop"
  },
  "Education & Training": {
    key: "education_training",
    url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400&auto=format&fit=crop"
  }
};

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function main() {
  try {
    const targetDir = path.join(__dirname, "../../public/images/categories");
    if (!fs.existsSync(targetDir)) {
      console.log(`📁 Creating directory: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Copy generated category hero if found
    const sourceHero = "C:\\Users\\SAI\\.gemini\\antigravity-ide\\brain\\7140d649-2bdb-41b7-af30-178b1eab1966\\category_hero_1783665394800.png";
    const destHero = path.join(targetDir, "category_hero.png");
    if (fs.existsSync(sourceHero)) {
      console.log(`Copying generated hero image to ${destHero}...`);
      fs.copyFileSync(sourceHero, destHero);
    }

    // 2. Fetch categories from DB
    console.log("Fetching categories from DB...");
    const dbRes = await pool.query("SELECT category_id, category_name FROM categories");
    const categories = dbRes.rows;

    for (const cat of categories) {
      const mapping = CATEGORIES_MAPPING[cat.category_name];
      if (!mapping) {
        console.log(`⚠️ No mapping found for category "${cat.category_name}", skipping.`);
        continue;
      }

      const filename = `${mapping.key}.jpg`;
      const localPath = path.join(targetDir, filename);
      const relativeDbPath = `public/images/categories/${filename}`;

      console.log(`Downloading image for "${cat.category_name}"...`);
      try {
        await downloadFile(mapping.url, localPath);
        console.log(`Saved locally to ${localPath}`);

        // Update DB
        await pool.query(
          "UPDATE categories SET category_image = $1 WHERE category_id = $2",
          [relativeDbPath, cat.category_id]
        );
        console.log(`Updated DB path to ${relativeDbPath}`);
      } catch (err) {
        console.error(`❌ Failed for "${cat.category_name}":`, err.message);
      }
    }

    console.log("🎉 Category media setup completed successfully!");
  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await pool.end();
  }
}

main();
