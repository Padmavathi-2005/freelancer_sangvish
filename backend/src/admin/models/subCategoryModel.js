import pool from "../../config/db.js";

export const getAllSubCategories = async () => {
    return await pool.query(`
        SELECT
            sc.*,
            c.category_name
        FROM sub_categories sc
        JOIN categories c
            ON sc.category_id = c.category_id
        ORDER BY sc.sub_category_id DESC
    `);
};

export const getSubCategoryById = async (id) => {
    return await pool.query(
        `SELECT * FROM sub_categories
         WHERE sub_category_id = $1`,
        [id]
    );
};

export const createSubCategory = async (
    category_id,
    sub_category_name,
    sub_category_image,
    status
) => {
    return await pool.query(
        `INSERT INTO sub_categories
        (
            category_id,
            sub_category_name,
            sub_category_image,
            status
        )
        VALUES ($1,$2,$3,$4)
        RETURNING *`,
        [
            category_id,
            sub_category_name,
            sub_category_image,
            status
        ]
    );
};

export const updateSubCategory = async (
    id,
    category_id,
    sub_category_name,
    sub_category_image,
    status
) => {
    return await pool.query(
        `UPDATE sub_categories
        SET
            category_id = $1,
            sub_category_name = $2,
            sub_category_image = $3,
            status = $4
        WHERE sub_category_id = $5
        RETURNING *`,
        [
            category_id,
            sub_category_name,
            sub_category_image,
            status,
            id
        ]
    );
};

export const deleteSubCategory = async (id) => {
    return await pool.query(
        `DELETE FROM sub_categories
         WHERE sub_category_id = $1
         RETURNING *`,
        [id]
    );
};