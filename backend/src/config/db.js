import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL Connected Successfully');
    
    // Auto-migration for missing subscription columns in users table
    try {
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS active_plan_id INT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS active_plan_subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS active_plan_expires_at TIMESTAMP;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_notified_7d BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_notified_3d BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_notified_1d BOOLEAN DEFAULT FALSE;
        `);
        console.log('✅ Subscription columns schema migration verified');
    } catch (schemaErr) {
        console.error('Schema auto-migration notice:', schemaErr.message);
    }

    client.release();
} catch (error) {
    console.error('❌ PostgreSQL Connection Failed');
    console.error(error.message);
}

export default pool;