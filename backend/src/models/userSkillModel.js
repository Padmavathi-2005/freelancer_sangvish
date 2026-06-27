import pool from "../config/db.js";

export const UserSkill = {

    addSkill: async (userId, skillId) => {
        return await pool.query(
            `INSERT INTO user_skills
            (user_id, skill_id)
            VALUES ($1,$2)
            RETURNING *`,
            [userId, skillId]
        );
    },

    getByUserId: async (userId) => {
        return await pool.query(
            `SELECT *
             FROM user_skills
             WHERE user_id = $1`,
            [userId]
        );
    },

    deleteByUserId: async (userId) => {
        return await pool.query(
            `DELETE FROM user_skills
             WHERE user_id = $1`,
            [userId]
        );
    }
};