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
    client.release();
} catch (error) {
    console.error('❌ PostgreSQL Connection Failed');
    console.error(error.message);
}

export default pool;