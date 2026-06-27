import pool from "../config/db.js";

export const Settings = {
    getAll: async () => {
        return await pool.query("SELECT * FROM settings");
    },
    
    getByKey: async (key) => {
        const res = await pool.query(
            "SELECT * FROM settings WHERE setting_key = $1",
            [key]
        );
        return res.rows[0];
    },

    upsert: async (category, key, valueJson) => {
        const check = await pool.query(
            "SELECT * FROM settings WHERE setting_key = $1",
            [key]
        );
        if (check.rows.length > 0) {
            return await pool.query(
                `UPDATE settings
                 SET setting_value = $1, category = $2, updated_at = NOW()
                 WHERE setting_key = $3
                 RETURNING *`,
                [JSON.stringify(valueJson), category, key]
            );
        } else {
            return await pool.query(
                `INSERT INTO settings (category, setting_key, setting_value)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [category, key, JSON.stringify(valueJson)]
            );
        }
    }
};

export default Settings;
