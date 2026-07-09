import pool from './db.js';

async function migrate() {
  console.log("Running group chat migrations...");
  try {
    // 1. Drop NOT NULL constraints from user_one_id and user_two_id in conversations
    await pool.query(`
      ALTER TABLE conversations ALTER COLUMN user_one_id DROP NOT NULL;
      ALTER TABLE conversations ALTER COLUMN user_two_id DROP NOT NULL;
    `);
    console.log("✅ Made user_one_id and user_two_id nullable in conversations");

    // 2. Drop unique_user_chat constraint if it exists
    await pool.query(`
      ALTER TABLE conversations DROP CONSTRAINT IF EXISTS unique_user_chat;
    `);
    console.log("✅ Dropped unique_user_chat constraint");

    // 3. Add columns is_group, group_name, and job_id to conversations
    await pool.query(`
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(job_id) ON DELETE SET NULL;
    `);
    console.log("✅ Added is_group, group_name, job_id columns to conversations");

    // 4. Create partial unique index unique_user_chat_idx
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_user_chat_idx 
      ON conversations (user_one_id, user_two_id) 
      WHERE (is_group = FALSE OR is_group IS NULL);
    `);
    console.log("✅ Created unique_user_chat_idx partial unique index");

    // 5. Create conversation_participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_participant_id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_conv_user UNIQUE (conversation_id, user_id)
      );
    `);
    console.log("✅ Created conversation_participants table");
    
    console.log("🎉 Group chat migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
