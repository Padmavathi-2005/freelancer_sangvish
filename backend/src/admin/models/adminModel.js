import pool from "../../config/db.js";

// 🟢 CREATE ADMIN
export const createAdmin = async (full_name, email, password_hash, role = "SUB_ADMIN") => {
    return await pool.query(
        `INSERT INTO admins (full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [full_name, email, password_hash, role]
    );
};

// 🔍 FIND BY EMAIL
export const findAdminByEmail = async (email) => {
    return await pool.query(
        `SELECT * FROM admins WHERE email = $1`,
        [email]
    );
};

// 📋 GET ALL ADMINS
export const getAllAdmins = async () => {
    return await pool.query(
        `SELECT * FROM admins ORDER BY admin_id DESC`
    );
};

// ❌ DELETE ADMIN (only sub admin allowed)
export const deleteAdminById = async (id) => {
    return await pool.query(
        `DELETE FROM admins 
         WHERE admin_id = $1 AND role = 'SUB_ADMIN'`,
        [id]
    );
};

// 🔍 FIND BY ID
export const findAdminById = async (id) => {
    return await pool.query(
        `SELECT * FROM admins WHERE admin_id = $1`,
        [id]
    );
};