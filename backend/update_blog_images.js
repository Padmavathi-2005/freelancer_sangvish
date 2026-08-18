import pool from './src/config/db.js';

async function updateBlogImages() {
  try {
    await pool.query("UPDATE blogs SET cover_image = '/public/images/blogs/blog_1_freelance_clients.jpg' WHERE slug LIKE '%freelance-clients%'");
    await pool.query("UPDATE blogs SET cover_image = '/public/images/blogs/blog_2_web_development.jpg' WHERE slug LIKE '%scalable-web%'");
    await pool.query("UPDATE blogs SET cover_image = '/public/images/blogs/blog_3_ui_ux_design.jpg' WHERE slug LIKE '%ui-ux%'");
    await pool.query("UPDATE blogs SET cover_image = '/public/images/blogs/blog_4_escrow_payments.jpg' WHERE slug LIKE '%escrow%'");
    console.log('✅ Updated blog cover image paths in PostgreSQL database');
  } catch (err) {
    console.error('Error updating blog images:', err);
  } finally {
    process.exit(0);
  }
}

updateBlogImages();
