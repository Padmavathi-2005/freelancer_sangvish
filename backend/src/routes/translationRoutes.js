import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// GET /api/translations/:code (Public endpoint to list key-value mappings)
router.get("/translations/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      "SELECT key, value FROM translations WHERE language_code = $1",
      [code.toUpperCase()]
    );

    // Format as a simple key-value object (mapping both exact and lowercase keys for 100% match)
    const mapping = {};
    for (const row of result.rows) {
      if (row.key) {
        mapping[row.key] = row.value;
        mapping[row.key.toLowerCase()] = row.value;
        mapping[row.key.trim().toLowerCase()] = row.value;
      }
    }

    res.status(200).json(mapping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/languages/active (Public endpoint to get list of active languages with their details)
router.get("/languages/active", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT language_name as name, code, direction FROM languages WHERE status = 'Active' AND is_site_lang = TRUE ORDER BY language_name ASC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
