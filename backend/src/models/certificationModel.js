import pool from "../config/db.js";

export const Certification = {

    create: async (
        userId,
        certificateName,
        issuingOrganization,
        issueDate,
        credentialUrl
    ) => {

        return await pool.query(
            `INSERT INTO certifications
            (
                user_id,
                certificate_name,
                issuing_organization,
                issue_date,
                credential_url
            )
            VALUES
            ($1,$2,$3,$4,$5)
            RETURNING *`,
            [
                userId,
                certificateName,
                issuingOrganization,
                issueDate,
                credentialUrl
            ]
        );
    },

    getByUserId: async (userId) => {
        return await pool.query(
            `SELECT *
             FROM certifications
             WHERE user_id = $1`,
            [userId]
        );
    },

    delete: async (certificationId, userId) => {
        return await pool.query(
            `DELETE FROM certifications
             WHERE certification_id = $1 AND user_id = $2
             RETURNING *`,
            [certificationId, userId]
        );
    }
};