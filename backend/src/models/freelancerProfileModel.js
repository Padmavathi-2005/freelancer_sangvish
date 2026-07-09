import pool from "../config/db.js";

export const FreelancerProfile = {

    create: async (
        userId,
        categoryId,
        subCategoryId,
        professionalTitle,
        experienceLevel,
        totalExperienceYears,
        hourlyRate,
        availabilityStatus,
        linkedinUrl,
        portfolioWebsite,
        resumeUrl
    ) => {

        return await pool.query(
            `INSERT INTO freelancer_profiles
            (
                user_id,
                category_id,
                sub_category_id,
                professional_title,
                experience_level,
                total_experience_years,
                hourly_rate,
                availability_status,
                linkedin_url,
                portfolio_website,
                resume_url
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *`,
            [
                userId,
                categoryId,
                subCategoryId,
                professionalTitle,
                experienceLevel,
                totalExperienceYears,
                hourlyRate,
                availabilityStatus,
                linkedinUrl,
                portfolioWebsite,
                resumeUrl
            ]
        );
    },

    findByUserId: async (userId) => {
        return await pool.query(
            `SELECT *
             FROM freelancer_profiles
             WHERE user_id = $1`,
            [userId]
        );
    },

    updateOnboardingStatus: async (userId, status) => {
        return await pool.query(
            `UPDATE freelancer_profiles
             SET onboarding_completed = $1
             WHERE user_id = $2
             RETURNING *`,
            [status, userId]
        );
    },

    updateVettingStatus: async (userId, vettingStatus) => {
        return await pool.query(
            `UPDATE freelancer_profiles
             SET vetting_status = $1, updated_at = NOW()
             WHERE user_id = $2
             RETURNING *`,
            [vettingStatus, userId]
        );
    },

    update: async (
        userId,
        categoryId,
        subCategoryId,
        professionalTitle,
        experienceLevel,
        totalExperienceYears,
        hourlyRate,
        availabilityStatus,
        linkedinUrl,
        portfolioWebsite,
        resumeUrl
    ) => {
        return await pool.query(
            `UPDATE freelancer_profiles
             SET category_id = $1,
                 sub_category_id = $2,
                 professional_title = $3,
                 experience_level = $4,
                 total_experience_years = $5,
                 hourly_rate = $6,
                 availability_status = $7,
                 linkedin_url = $8,
                 portfolio_website = $9,
                 resume_url = $10,
                 updated_at = NOW()
             WHERE user_id = $11
             RETURNING *`,
            [
                categoryId,
                subCategoryId,
                professionalTitle,
                experienceLevel,
                totalExperienceYears,
                hourlyRate,
                availabilityStatus,
                linkedinUrl,
                portfolioWebsite,
                resumeUrl,
                userId
            ]
        );
    },

    updateCurrentStep: async (userId, step) => {
        return await pool.query(
            `UPDATE freelancer_profiles
             SET current_step = $1
             WHERE user_id = $2
             RETURNING *`,
            [step, userId]
        );
    }
};