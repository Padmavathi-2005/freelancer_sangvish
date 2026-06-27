import pool from "../config/db.js";

export const UserLanguage = {
    addLanguage: async (userId, languageId) => {
        return await pool.query(
            `INSERT INTO user_languages
            (user_id, language_id)
            VALUES ($1, $2)
            RETURNING *`,
            [userId, languageId]
        );
    },

    getByUserId: async (userId) => {
        return await pool.query(
            `SELECT ul.*, l.language_name
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
