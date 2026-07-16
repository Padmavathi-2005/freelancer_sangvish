import pool from "../config/db.js";

export const FormField = {
  getAll: async () => {
    const res = await pool.query("SELECT * FROM form_field_options ORDER BY field_key, sort_order");
    return res.rows;
  },

  getByFieldKey: async (fieldKey) => {
    const res = await pool.query(
      "SELECT * FROM form_field_options WHERE field_key = $1 ORDER BY sort_order",
      [fieldKey]
    );
    return res.rows;
  },

  addOption: async (fieldKey, optionValue) => {
    const maxRes = await pool.query(
      "SELECT MAX(sort_order) FROM form_field_options WHERE field_key = $1",
      [fieldKey]
    );
    const nextSort = maxRes.rows[0].max !== null ? parseInt(maxRes.rows[0].max) + 1 : 0;

    const res = await pool.query(
      `INSERT INTO form_field_options (field_key, option_value, sort_order) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [fieldKey, optionValue.trim(), nextSort]
    );
    return res.rows[0];
  },

  deleteOption: async (optionId) => {
    const res = await pool.query(
      "DELETE FROM form_field_options WHERE option_id = $1 RETURNING *",
      [optionId]
    );
    return res.rows[0];
  }
};

export default FormField;
