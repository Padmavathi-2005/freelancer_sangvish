import pool from "../../config/db.js";

export const getAllCategories = async () => {
    return await pool.query(`
        SELECT *
        FROM categories
        ORDER BY category_id DESC
    `);
};

export const getCategoryById = async (id) => {
    return await pool.query(
        `SELECT * FROM categories WHERE category_id = $1`,
        [id]
    );
};

export const createCategory = async (
    category_name,
    category_image,
    status,
    description = null,
    category_video = null
) => {
    return await pool.query(
        `INSERT INTO categories
        (category_name, category_image, status, description, category_video)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [category_name, category_image, status, description, category_video]
    );
};

export const updateCategory = async (
    id,
    category_name,
    category_image,
    status,
    description = null,
    category_video = null
) => {
    return await pool.query(
        `UPDATE categories
        SET category_name = $1,
            category_image = $2,
            status = $3,
            description = $4,
            category_video = $5
        WHERE category_id = $6
        RETURNING *`,
        [category_name, category_image, status, description, category_video, id]
    );
};

export const deleteCategory = async (id) => {
    return await pool.query(
        `DELETE FROM categories
        WHERE category_id = $1
        RETURNING *`,
        [id]
    );
};