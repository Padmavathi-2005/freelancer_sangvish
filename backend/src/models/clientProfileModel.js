import pool from "../config/db.js";

export const ClientProfile = {
    create: async (
        userId,
        companyName = null,
        companySize = null,
        industry = null,
        companyWebsite = null,
        companyDescription = null,
        companyEstablishedYear = null,
        hiringContactName = null,
        hiringContactDesignation = null
    ) => {
        return await pool.query(
            `INSERT INTO client_profiles
            (
                user_id,
                company_name,
                company_size,
                industry,
                company_website,
                company_description,
                company_established_year,
                hiring_contact_name,
                hiring_contact_designation,
                onboarding_completed
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
            RETURNING *`,
            [
                userId,
                companyName,
                companySize,
                industry,
                companyWebsite,
                companyDescription,
                companyEstablishedYear,
                hiringContactName,
                hiringContactDesignation
            ]
        );
    },

    findByUserId: async (userId) => {
        return await pool.query(
            `SELECT *
             FROM client_profiles
             WHERE user_id = $1`,
            [userId]
        );
    },

    updateOnboardingStatus: async (userId, status) => {
        return await pool.query(
            `UPDATE client_profiles
             SET onboarding_completed = $1
             WHERE user_id = $2
             RETURNING *`,
            [status, userId]
        );
    },

    update: async (
        userId,
        companyName,
        companySize,
        industry,
        companyWebsite,
        companyDescription,
        companyEstablishedYear,
        hiringContactName,
        hiringContactDesignation
    ) => {
        return await pool.query(
            `UPDATE client_profiles
             SET company_name = $1,
                 company_size = $2,
                 industry = $3,
                 company_website = $4,
                 company_description = $5,
                 company_established_year = $6,
                 hiring_contact_name = $7,
                 hiring_contact_designation = $8,
                 updated_at = NOW()
             WHERE user_id = $9
             RETURNING *`,
            [
                companyName,
                companySize,
                industry,
                companyWebsite,
                companyDescription,
                companyEstablishedYear,
                hiringContactName,
                hiringContactDesignation,
                userId
            ]
        );
    }
};

export default ClientProfile;

