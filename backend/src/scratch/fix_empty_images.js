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
    url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=400&auto=format&fit=crop"
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
    url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop"
  },
  "Photography": {
    key: "photography",
    url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=400&auto=format&fit=crop"
  },
  "Customer Support": {
    key: "customer_support",
    url: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=400&auto=format&fit=crop"
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
    url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&auto=format&fit=crop"
  },
  "Education & Training": {
    key: "education_training",
    url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400&auto=format&fit=crop"
  }
};

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle redirect
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`Following redirect from ${url} to ${response.headers.location}...`);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
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

    console.log("Checking for empty or missing images in category directory...");
    const dbRes = await pool.query("SELECT category_id, category_name FROM categories");
    const categories = dbRes.rows;

    for (const cat of categories) {
      const mapping = CATEGORIES_MAPPING[cat.category_name];
      if (!mapping) continue;

      const filename = `${mapping.key}.jpg`;
      const localPath = path.join(targetDir, filename);

      let shouldDownload = false;
      if (!fs.existsSync(localPath)) {
        shouldDownload = true;
      } else {
        const stats = fs.statSync(localPath);
        if (stats.size === 0) {
          shouldDownload = true;
          console.log(`⚠️ File ${filename} is 0 bytes. Re-downloading...`);
          fs.unlinkSync(localPath);
        }
      }

      if (shouldDownload) {
        console.log(`Downloading redirect-safe image for "${cat.category_name}"...`);
        try {
          await downloadFile(mapping.url, localPath);
          const newStats = fs.statSync(localPath);
          console.log(`Saved locally to ${localPath} (${newStats.size} bytes)`);

          const relativeDbPath = `public/images/categories/${filename}`;
          await pool.query(
            "UPDATE categories SET category_image = $1 WHERE category_id = $2",
            [relativeDbPath, cat.category_id]
          );
        } catch (err) {
          console.error(`❌ Failed to fix "${cat.category_name}":`, err.message);
        }
      }
    }

    console.log("🎉 Checked and fixed empty category images!");
  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await pool.end();
  }
}

main();
