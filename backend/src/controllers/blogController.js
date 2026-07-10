import pool from "../config/db.js";

// helper to slugify strings if slug is not provided
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")          // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start
    .replace(/-+$/, "");            // Trim - from end
};

// GET /api/blogs (Public)
export const getPublicBlogs = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT b.*, COALESCE(b.author_name, u.first_name, 'Administrator') as author_name, u.email as author_email
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.user_id
      WHERE b.is_published = true
    `;
    const values = [];
    let countValues = [];
    let whereClause = "";

    if (search) {
      values.push(`%${search}%`);
      whereClause += ` AND (b.title ILIKE $${values.length} OR b.summary ILIKE $${values.length})`;
    }

    if (category && category !== "all") {
      values.push(category);
      whereClause += ` AND b.category = $${values.length}`;
    }

    query += whereClause;
    query += ` ORDER BY b.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    const countQuery = `
      SELECT COUNT(*) FROM blogs b WHERE b.is_published = true ${whereClause}
    `;

    // Copy search/category values for count query
    countValues = [...values];

    // Add limit & offset for main query
    values.push(parseInt(limit));
    values.push(offset);

    const dataRes = await pool.query(query, values);
    const countRes = await pool.query(countQuery, countValues);

    const totalBlogs = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(totalBlogs / parseInt(limit));

    res.status(200).json({
      blogs: dataRes.rows,
      pagination: {
        totalBlogs,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/blogs/:slug (Public)
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const query = `
      SELECT b.*, COALESCE(b.author_name, u.first_name, 'Administrator') as author_name, u.email as author_email
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.user_id
      WHERE b.slug = $1 AND b.is_published = true
    `;
    const result = await pool.query(query, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/blogs (Admin Only)
export const adminGetBlogs = async (req, res) => {
  try {
    const query = `
      SELECT b.*, COALESCE(b.author_name, u.first_name, 'Administrator') as author_name, u.email as author_email
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.user_id
      ORDER BY b.created_at DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/blogs/:id (Admin Only)
export const adminGetBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT * FROM blogs WHERE blog_id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/blogs (Admin Only)
export const adminCreateBlog = async (req, res) => {
  try {
    const { title, slug, summary, content, cover_image, category, is_published, author_name } = req.body;
    const author_id = req.admin?.user_id || req.admin?.id || null; // fallback in case admin token user_id structure is id

    let finalSlug = slug ? slugify(slug) : slugify(title);

    // Verify slug uniqueness
    const slugCheck = await pool.query("SELECT blog_id FROM blogs WHERE slug = $1", [finalSlug]);
    if (slugCheck.rows.length > 0) {
      // Append random suffix if duplicate
      finalSlug = `${finalSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const query = `
      INSERT INTO blogs 
      (title, slug, summary, content, cover_image, author_id, category, is_published, author_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      title,
      finalSlug,
      summary || "",
      content,
      cover_image || "",
      author_id,
      category || "General",
      is_published === true || is_published === "true",
      author_name || null
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Blog created successfully",
      blog: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/blogs/:id (Admin Only)
export const adminUpdateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, summary, content, cover_image, category, is_published, author_name } = req.body;

    let finalSlug = slug ? slugify(slug) : slugify(title);

    // Verify slug uniqueness excluding current blog
    const slugCheck = await pool.query(
      "SELECT blog_id FROM blogs WHERE slug = $1 AND blog_id != $2",
      [finalSlug, id]
    );
    if (slugCheck.rows.length > 0) {
      finalSlug = `${finalSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const query = `
      UPDATE blogs
      SET title = $1,
          slug = $2,
          summary = $3,
          content = $4,
          cover_image = $5,
          category = $6,
          is_published = $7,
          author_name = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE blog_id = $9
      RETURNING *
    `;
    const values = [
      title,
      finalSlug,
      summary || "",
      content,
      cover_image || "",
      category || "General",
      is_published === true || is_published === "true",
      author_name || null,
      id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json({
      message: "Blog updated successfully",
      blog: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/blogs/:id (Admin Only)
export const adminDeleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `DELETE FROM blogs WHERE blog_id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json({
      message: "Blog post deleted successfully",
      blog: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
