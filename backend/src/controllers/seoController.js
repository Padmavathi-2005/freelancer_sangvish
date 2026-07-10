import pool from '../config/db.js';

// GET /api/seo
export const getSeoByRoute = async (req, res) => {
  try {
    const { route } = req.query;
    if (!route) {
      return res.status(400).json({ message: "route query parameter is required." });
    }

    const result = await pool.query(
      `SELECT * FROM seo_settings WHERE route_path = $1`,
      [route]
    );

    if (result.rows.length === 0) {
      // Fallback to home page SEO config
      const fallback = await pool.query(
        `SELECT * FROM seo_settings WHERE route_path = '/'`
      );
      if (fallback.rows.length > 0) {
        return res.status(200).json(fallback.rows[0]);
      }
      return res.status(404).json({ message: "SEO settings not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching SEO settings:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/seo
export const getAllSeoSettings = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM seo_settings ORDER BY seo_id ASC`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching all SEO settings:", error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/seo/:id
export const updateSeoSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      meta_title,
      meta_description,
      meta_keywords,
      og_title,
      og_description,
      og_image
    } = req.body;

    const result = await pool.query(
      `UPDATE seo_settings
       SET meta_title = $1,
           meta_description = $2,
           meta_keywords = $3,
           og_title = $4,
           og_description = $5,
           og_image = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE seo_id = $7
       RETURNING *`,
      [
        meta_title,
        meta_description,
        meta_keywords || null,
        og_title || null,
        og_description || null,
        og_image || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "SEO record not found." });
    }

    res.status(200).json({ message: "SEO settings updated successfully", settings: result.rows[0] });
  } catch (error) {
    console.error("Error updating SEO settings:", error);
    res.status(500).json({ message: error.message });
  }
};
