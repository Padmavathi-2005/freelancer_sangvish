import pool from "../config/db.js";

async function createBlogsTable() {
  try {
    console.log("Checking database connection and creating tables...");

    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blogs'
      );
    `;
    const checkRes = await pool.query(checkTableQuery);
    const tableExists = checkRes.rows[0].exists;

    if (tableExists) {
      console.log("Table 'blogs' already exists in the database.");
    } else {
      console.log("Creating table 'blogs'...");
      const createTableQuery = `
        CREATE TABLE blogs (
          blog_id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          summary TEXT,
          content TEXT NOT NULL,
          cover_image VARCHAR(512),
          author_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
          category VARCHAR(100),
          is_published BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await pool.query(createTableQuery);
      console.log("✅ Table 'blogs' successfully created.");
    }

    // List all tables to verify
    const listRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Current Tables:", listRes.rows.map(r => r.table_name));

  } catch (error) {
    console.error("❌ Error creating table 'blogs':", error);
  } finally {
    await pool.end();
  }
}

createBlogsTable();
