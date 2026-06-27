import pool from "../../config/db.js";

export const getAllSkills = async () => {
    return await pool.query(`
        SELECT
            s.*,
            sc.sub_category_name,
            c.category_name
        FROM skills s
        JOIN sub_categories sc
            ON s.sub_category_id = sc.sub_category_id
        JOIN categories c
            ON sc.category_id = c.category_id
        ORDER BY s.skill_id DESC
    `);
};

export const getSkillById = async (id) => {
    return await pool.query(
        `SELECT * FROM skills
         WHERE skill_id = $1`,
        [id]
    );
};

export const createSkill = async (
    sub_category_id,
    skill_name,
    status
) => {
    return await pool.query(
        `INSERT INTO skills
        (
            sub_category_id,
            skill_name,
            status
        )
        VALUES ($1,$2,$3)
        RETURNING *`,
        [
            sub_category_id,
            skill_name,
            status
        ]
    );
};

export const updateSkill = async (
    id,
    sub_category_id,
    skill_name,
    status
) => {
    return await pool.query(
        `UPDATE skills
         SET
            sub_category_id = $1,
            skill_name = $2,
            status = $3
         WHERE skill_id = $4
         RETURNING *`,
        [
            sub_category_id,
            skill_name,
            status,
            id
        ]
    );
};

export const deleteSkill = async (id) => {
    return await pool.query(
        `DELETE FROM skills
         WHERE skill_id = $1
         RETURNING *`,
        [id]
    );
};

export const getSkillsBySubCategory = async (
    sub_category_id
) => {
    return await pool.query(
        `SELECT *
         FROM skills
         WHERE sub_category_id = $1
         AND status = true
         ORDER BY skill_name`,
        [sub_category_id]
    );
};