import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import pool from "./src/config/db.js";

// Check where the Excel file is located
let excelPath = "./all_subcategory_skills_15_each.xlsx";
if (!fs.existsSync(excelPath)) {
    excelPath = "../all_subcategory_skills_15_each.xlsx";
}
if (!fs.existsSync(excelPath)) {
    console.error("❌ Could not find all_subcategory_skills_15_each.xlsx in current or parent directory.");
    process.exit(1);
}

console.log(`📂 Reading Excel file from: ${path.resolve(excelPath)}`);

// Read Excel
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`📊 Found ${data.length} skill records in sheet.`);

async function importSkills() {
    try {
        let successCount = 0;
        let failCount = 0;

        for (const row of data) {
            const subCategoryId = row.sub_category_id;
            const skillName = row.skill_name;
            
            if (!subCategoryId || !skillName) {
                console.warn("⚠️ Skipping invalid row format:", row);
                continue;
            }

            try {
                await pool.query(
                    `
                    INSERT INTO skills
                    (
                        sub_category_id,
                        skill_name
                    )
                    VALUES ($1, $2)
                    `,
                    [
                        subCategoryId,
                        skillName
                    ]
                );
                successCount++;
            } catch (err) {
                // If it fails (e.g. unique constraint or missing key), log warning and continue
                console.warn(`⚠️ Warning inserting skill "${skillName}" (Subcategory ID: ${subCategoryId}):`, err.message);
                failCount++;
            }
        }

        console.log(`\n🎉 Skills Import Complete:`);
        console.log(`   - Success: ${successCount} records`);
        console.log(`   - Failed/Skipped: ${failCount} records`);

    } catch (error) {
        console.error("❌ Fatal error during skills import:", error);
    } finally {
        // Close database pool connection
        await pool.end();
        console.log("🔌 Database pool connections closed successfully.");
        process.exit(0);
    }
}

importSkills();
