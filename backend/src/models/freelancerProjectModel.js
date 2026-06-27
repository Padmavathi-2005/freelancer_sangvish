import pool from "../config/db.js";

export const FreelancerProject = {

    create: async (
        userId,
        title,
        description,
        imageUrls,
        videoUrls,
        documentUrls
    ) => {

        return await pool.query(
            `INSERT INTO freelancer_projects
            (
                user_id,
                title,
                description,
                image_urls,
                video_urls,
                document_urls
            )
            VALUES
            ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [
                userId,
                title,
                description,
                JSON.stringify(imageUrls),
                videoUrls,
                JSON.stringify(documentUrls)
            ]
        );
    },

    getByUserId: async (userId) => {
        return await pool.query(
            `SELECT *
             FROM freelancer_projects
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
    }
};