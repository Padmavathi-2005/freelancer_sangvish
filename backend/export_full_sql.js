import pool from "./src/config/db.js";
import fs from "fs";
import path from "path";

async function exportDatabase() {
  console.log("Starting PostgreSQL database dump...");
  let sqlOutput = "-- PostgreSQL Database Dump for Freelancer Platform\n";
  sqlOutput += "-- Created: " + new Date().toISOString() + "\n\n";
  sqlOutput += "SET statement_timeout = 0;\n";
  sqlOutput += "SET lock_timeout = 0;\n";
  sqlOutput += "SET client_encoding = 'UTF8';\n";
  sqlOutput += "SET standard_conforming_strings = on;\n\n";

  // 1. Get all tables in database
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const tables = tablesRes.rows.map(r => r.table_name);
  console.log(`Found ${tables.length} tables:`, tables.join(", "));

  for (const table of tables) {
    sqlOutput += `\n-- --------------------------------------------------------\n`;
    sqlOutput += `-- Table structure for ${table}\n`;
    sqlOutput += `-- --------------------------------------------------------\n\n`;

    // Drop table
    sqlOutput += `DROP TABLE IF EXISTS "${table}" CASCADE;\n\n`;

    // Get columns
    const colsRes = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [table]);

    let colDefs = [];
    for (const col of colsRes.rows) {
      let def = `"${col.column_name}" ${col.data_type.toUpperCase()}`;
      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`;
      }
      if (col.is_nullable === 'NO') {
        def += ` NOT NULL`;
      }
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      colDefs.push(def);
    }

    // Get primary key
    const pkRes = await pool.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1;
    `, [table]);

    if (pkRes.rows.length > 0) {
      const pkCols = pkRes.rows.map(r => `"${r.column_name}"`).join(", ");
      colDefs.push(`PRIMARY KEY (${pkCols})`);
    }

    sqlOutput += `CREATE TABLE "${table}" (\n  ` + colDefs.join(",\n  ") + `\n);\n\n`;

    // Get Data
    const dataRes = await pool.query(`SELECT * FROM "${table}"`);
    if (dataRes.rows.length > 0) {
      sqlOutput += `-- Dumping data for ${table}\n`;
      for (const row of dataRes.rows) {
        const columns = Object.keys(row).map(c => `"${c}"`).join(", ");
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "number" || typeof val === "boolean") return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(", ");

        sqlOutput += `INSERT INTO "${table}" (${columns}) VALUES (${values});\n`;
      }
      sqlOutput += `\n`;
    }
  }

  const outputPath = path.join(process.cwd(), "freelancer_database.sql");
  fs.writeFileSync(outputPath, sqlOutput, "utf8");
  console.log(`✅ Complete database dump successfully written to: ${outputPath}`);
  await pool.end();
}

exportDatabase().catch(err => {
  console.error("Export error:", err);
  process.exit(1);
});
