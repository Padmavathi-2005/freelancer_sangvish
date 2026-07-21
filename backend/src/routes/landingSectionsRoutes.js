import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Get Why Choose features
router.get('/why-choose-features', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM why_choose_features ORDER BY sort_order ASC, feature_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get How It Works steps
router.get('/how-it-works-steps', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM how_it_works_steps ORDER BY sort_order ASC, step_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public: categories with freelancer count (onboarded freelancers per category)
router.get('/categories-stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.category_id,
                c.category_name,
                c.category_image,
                c.description,
                c.category_video,
                COUNT(fp.user_id) AS freelancer_count
            FROM categories c
            LEFT JOIN freelancer_profiles fp
                ON fp.category_id = c.category_id
                AND fp.onboarding_completed = true
                AND fp.vetting_status = 'Approved'
            GROUP BY c.category_id, c.category_name, c.category_image, c.description, c.category_video
            ORDER BY freelancer_count DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public: distinct client company names (for hero ticker) of clients who have posted projects
router.get('/client-companies', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT cp.company_name
            FROM client_profiles cp
            JOIN users u ON u.user_id = cp.user_id
            JOIN jobs j ON j.client_id = cp.user_id
            WHERE cp.company_name IS NOT NULL
              AND TRIM(cp.company_name) <> ''
              AND u.is_active = true
            ORDER BY cp.company_name ASC
        `);
        res.json(result.rows.map(r => r.company_name));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
