import pool from '../config/db.js';

const createUser = async (
    first_name,
    email,
    password_hash,
    referral_code,
    referred_by = null
) => {

    const query = `
        INSERT INTO users
        (
            first_name,
            email,
            password_hash,
            referral_code,
            referred_by
        )
        VALUES
        ($1,$2,$3,$4,$5)
        RETURNING *
    `;

    const values = [
        first_name,
        email,
        password_hash,
        referral_code,
        referred_by
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const findUserByEmail = async (email) => {

    const query = `
        SELECT *
        FROM users
        WHERE email = $1
    `;

    const result = await pool.query(query, [email]);

    return result.rows[0];
};

export {
    createUser,
    findUserByEmail
};