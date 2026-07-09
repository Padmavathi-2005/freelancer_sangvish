import pool from "../config/db.js";

export const UserLanguage = {
    addLanguage: async (userId, languageId, proficiency = 'Basic') => {
        return await pool.query(
            `INSERT INTO user_languages
            (user_id, language_id, proficiency)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, language_id) DO UPDATE 
            SET proficiency = EXCLUDED.proficiency
            RETURNING *`,
            [userId, languageId, proficiency]
        );
    },

    getByUserId: async (userId) => {
        return await pool.query(
            `SELECT ul.*, l.language_name, l.code
             FROM user_languages ul
             JOIN languages l ON ul.language_id = l.language_id
             WHERE ul.user_id = $1`,
             [userId]
        );
    },

    deleteByUserId: async (userId) => {
        return await pool.query(
            `DELETE FROM user_languages
             WHERE user_id = $1`,
             [userId]
        );
    }
};
export default UserLanguage;
