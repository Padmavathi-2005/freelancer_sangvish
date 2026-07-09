import pool from '../config/db.js';

async function run() {
  try {
    const gig = (await pool.query("SELECT * FROM gigs WHERE gig_id = 7")).rows[0];
    
    const currency = await pool.query("SELECT * FROM currencies WHERE currency_id = $1", [gig.currency_id]);
    console.log("Currency:", currency.rows);

    const category = await pool.query("SELECT * FROM categories WHERE category_id = $1", [gig.category_id]);
    console.log("Category:", category.rows);

    const subCategory = await pool.query("SELECT * FROM sub_categories WHERE sub_category_id = $1", [gig.sub_category_id]);
    console.log("Subcategory:", subCategory.rows);

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
