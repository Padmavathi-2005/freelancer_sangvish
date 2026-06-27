import pool from "../config/db.js";

export const Experience = {

    create: async (
        userId,
        companyName,
        jobTitle,
        employmentType,
        startDate,
        endDate,
        currentlyWorking,
        description
    ) => {

        return await pool.query(
            `INSERT INTO experiences
            (
                user_id,
                company_name,
                job_title,
                employment_type,
                start_date,
                end_date,
                currently_working,
                description
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *`,
            [
                userId,
                companyName,
                jobTitle,
                employmentType,
                startDate,
                endDate,
                currentlyWorking,
                description
            ]
        );
    },

    getByUserId: async (userId) => {
        return await pool.query(
            `SELECT *
             FROM experiences
             WHERE user_id = $1`,
            [userId]
        );
    }
};