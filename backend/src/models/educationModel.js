import pool from "../config/db.js";

export const Education = {

    create: async (
        userId,
        institutionName,
        degree,
        fieldOfStudy,
        startYear,
        endYear
    ) => {

        return await pool.query(
            `INSERT INTO education
            (
                user_id,
                institution_name,
                degree,
                field_of_study,
                start_year,
                end_year
            )
            VALUES
            ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [
                userId,
                institutionName,
                degree,
                fieldOfStudy,
                startYear,
                endYear
            ]
        );
    },

    getByUserId: async (userId) => {
        return await pool.query(
            `SELECT *
             FROM education
             WHERE user_id = $1`,
            [userId]
        );
    },

    delete: async (educationId, userId) => {
        return await pool.query(
            `DELETE FROM education
             WHERE education_id = $1 AND user_id = $2
             RETURNING *`,
            [educationId, userId]
        );
    }
};