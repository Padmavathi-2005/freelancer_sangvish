import pool from "../../config/db.js";

// GET /api/admin/cms/pages
export const getAllPages = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT page_id, title, slug, status, content_type, created_at, updated_at FROM cms_pages ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/cms/pages/:id
export const getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM cms_pages WHERE page_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/cms/pages
export const createPage = async (req, res) => {
  try {
    const { title, slug, status, content_type, content, seo } = req.body;

    // Check slug uniqueness
    const slugCheck = await pool.query(
      "SELECT page_id FROM cms_pages WHERE slug = $1",
      [slug]
    );
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ message: "Page with this slug already exists" });
    }

    const result = await pool.query(
      `INSERT INTO cms_pages (title, slug, status, content_type, content, seo) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        title,
        slug,
        status || "Draft",
        content_type || "Builder",
        content || "[]",
        seo ? (typeof seo === 'string' ? seo : JSON.stringify(seo)) : null
      ]
    );

    res.status(201).json({
      message: "Page created successfully",
      page: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/cms/pages/:id
export const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, status, content_type, content, seo } = req.body;

    // Check slug uniqueness excluding current page
    const slugCheck = await pool.query(
      "SELECT page_id FROM cms_pages WHERE slug = $1 AND page_id != $2",
      [slug, id]
    );
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ message: "Page with this slug already exists" });
    }

    const result = await pool.query(
      `UPDATE cms_pages 
       SET title = $1, slug = $2, status = $3, content_type = $4, content = $5, seo = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE page_id = $7 
       RETURNING *`,
      [
        title,
        slug,
        status,
        content_type,
        content,
        seo ? (typeof seo === 'string' ? seo : JSON.stringify(seo)) : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.status(200).json({
      message: "Page updated successfully",
      page: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/cms/pages/:id
export const deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM cms_pages WHERE page_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.status(200).json({ message: "Page deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/pages/:slug (Public API to get published page content)
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      "SELECT title, content_type, content, seo FROM cms_pages WHERE slug = $1 AND status = 'Published'",
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/pages (Public API to get all published pages titles and slugs)
export const getPublicPages = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT title, slug FROM cms_pages WHERE status = 'Published' ORDER BY title ASC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
